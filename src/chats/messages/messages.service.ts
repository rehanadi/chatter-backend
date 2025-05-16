import { Injectable } from '@nestjs/common';
import { ChatsRepository } from "../chats.repository";
import { Message } from "./entities/message.entity";
import { Types } from "mongoose";
import { CreateMessageInput } from "./dto/create-message.input";
import { GetMessagesArgs } from "./dto/get-messages.args";

@Injectable()
export class MessagesService {
  constructor(private readonly chatsRepository: ChatsRepository) {}

  private userChatFilter(userId: string) {
    return {
      $or: [
        { userId },
        {
          userIds: {
            $in: [userId],
          },
        },
      ],
    };
  }

  async createMessage({ content, chatId }: CreateMessageInput, userId: string) {
    const message: Message = {
      _id: new Types.ObjectId(),
      content,
      userId,
      createdAt: new Date(),
    };

    // Find the chat by chat ID or owner of the chat by user ID
    await this.chatsRepository.findOneAndUpdate(
      {
        _id: chatId,
        ...this.userChatFilter(userId),
      },
      {
        $push: {
          messages: message,
        },
      },
    );

    return message;
  }

  async getMessages({ chatId }: GetMessagesArgs, userId: string) {
    const chat = await this.chatsRepository.findOne({
      _id: chatId,
      ...this.userChatFilter(userId),
    });

    return chat.messages;
  }
}
