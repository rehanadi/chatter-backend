import { Inject, Injectable } from '@nestjs/common';
import { ChatsRepository } from "../chats.repository";
import { Message } from "./entities/message.entity";
import { Types } from "mongoose";
import { CreateMessageInput } from "./dto/create-message.input";
import { GetMessagesArgs } from "./dto/get-messages.args";
import { PubSub } from "graphql-subscriptions";
import { PUB_SUB } from "src/common/constants/injection-tokens";
import { MESSAGE_CREATED } from "./constants/pubsub-triggers";
import { MessageDocument } from "./entities/message.schema";
import { UsersService } from "src/users/users.service";

@Injectable()
export class MessagesService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly usersService: UsersService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async createMessage({ content, chatId }: CreateMessageInput, userId: string) {
    const messageDocument: MessageDocument = {
      _id: new Types.ObjectId(),
      content,
      userId: new Types.ObjectId(userId),
      createdAt: new Date(),
    };

    // Find the chat by chat ID or owner of the chat by user ID
    await this.chatsRepository.findOneAndUpdate(
      {
        _id: chatId,
        // ...this.chatsService.userChatFilter(userId),
      },
      {
        $push: {
          messages: messageDocument,
        },
      },
    );

    const user = await this.usersService.findOne(userId);

    const message: Message = {
      ...messageDocument,
      chatId,
      user,
    };

    await this.pubSub.publish(MESSAGE_CREATED, {
      messageCreated: message,
    });

    return message;
  }

  async getMessages({ chatId, skip, limit }: GetMessagesArgs) {
    // Aggragate to convert MongoDB document into entity object
    const messages = await this.chatsRepository.model.aggregate([
      { $match: { _id: new Types.ObjectId(chatId) } }, // Find the chat by chat ID
      { $unwind: '$messages' }, // Unpack the messages column from the chat
      { $replaceRoot: { newRoot: '$messages' } }, // Remove chat properties except messages
      { $sort: { createdAt: -1 } }, // Sort the messages by createdAt in descending order
      { $skip: skip ?? 0 }, // Skip the first n messages
      { $limit: limit ?? 15 }, // Limit the number of messages to n
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      }, // Join the user collection to get user details
      { $unwind: '$user' }, // Unpack the user column from the message
      { $unset: 'userId' }, // Remove the userId field from the message
      { $set: { chatId } }, // Add the chatId field to the message
    ]);

    messages.forEach((message) => {
      message.user = this.usersService.toEntity(message.user); // Convert user document to entity
    });

    return messages;
  }

  async messageCreated() {
    return this.pubSub.asyncIterableIterator<Message>(MESSAGE_CREATED);
  }

  async countMessages(chatId: string) {
    return (
      await this.chatsRepository.model.aggregate([
        { $match: { _id: new Types.ObjectId(chatId) } }, // Find the chat by chat ID
        { $unwind: '$messages' }, // Unpack the messages column from the chat
        { $count: 'count' }, // Count the number of messages
      ])
    )[0];
  }
}
