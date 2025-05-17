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
import { ChatsService } from "../chats.service";

@Injectable()
export class MessagesService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly chatsService: ChatsService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async createMessage({ content, chatId }: CreateMessageInput, userId: string) {
    const message: Message = {
      _id: new Types.ObjectId(),
      content,
      userId,
      chatId,
      createdAt: new Date(),
    };

    // Find the chat by chat ID or owner of the chat by user ID
    await this.chatsRepository.findOneAndUpdate(
      {
        _id: chatId,
        ...this.chatsService.userChatFilter(userId),
      },
      {
        $push: {
          messages: message,
        },
      },
    );

    await this.pubSub.publish(MESSAGE_CREATED, {
      messageCreated: message,
    });

    return message;
  }

  async getMessages({ chatId }: GetMessagesArgs, userId: string) {
    const chat = await this.chatsRepository.findOne({
      _id: chatId,
      ...this.chatsService.userChatFilter(userId),
    });

    return chat.messages;
  }

  async messageCreated({ chatId }: MessageCreatedArgs, userId: string) {
    // Authenticate the user and check if they have access to the chat
    await this.chatsRepository.findOne({
      _id: chatId,
      ...this.chatsService.userChatFilter(userId),
    });

    return this.pubSub.asyncIterableIterator<Message>(MESSAGE_CREATED);
  }
}
