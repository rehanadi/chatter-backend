import { Inject, Injectable } from '@nestjs/common';
import { ChatsRepository } from "../chats.repository";
import { Message } from "./entities/message.entity";
import { Types } from "mongoose";
import { CreateMessageInput } from "./dto/create-message.input";
import { GetMessagesArgs } from "./dto/get-messages.args";
import { PubSub } from "graphql-subscriptions";
import { PUB_SUB } from "src/common/constants/injection-tokens";
import { MESSAGE_CREATED } from "./constants/pubsub-triggers";
import { MessageCreatedArgs } from "./dto/message-created.args";
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

  async getMessages({ chatId }: GetMessagesArgs) {
    // Aggragate to convert MongoDB document into entity object
    return this.chatsRepository.model.aggregate([
      { $match: { _id: new Types.ObjectId(chatId) } }, // Find the chat by chat ID
      { $unwind: '$messages' }, // Unpack the messages column from the chat
      { $replaceRoot: { newRoot: '$messages' } }, // Remove chat properties except messages
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
  }

  async messageCreated({ chatId }: MessageCreatedArgs) {
    // Authenticate the user and check if they have access to the chat
    await this.chatsRepository.findOne({
      _id: chatId,
      // ...this.chatsService.userChatFilter(userId),
    });

    return this.pubSub.asyncIterableIterator<Message>(MESSAGE_CREATED);
  }
}
