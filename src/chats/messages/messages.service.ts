import { Injectable } from '@nestjs/common';
import { ChatsRepository } from "../chats.repository";
import { Message } from "./entities/message.entity";
import { Types } from "mongoose";
import { CreateMessageInput } from "./dto/create-message.input";

@Injectable()
export class MessagesService {
  constructor(private readonly chatsRepository: ChatsRepository) {}

  async create({ content, chatId }: CreateMessageInput, userId: string) {
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
        $or: [
          { userId },
          {
            userIds: {
              $in: [userId],
            },
          },
        ],
      },
      {
        $push: {
          messages: message,
        },
      },
    );

    return message;
  }
}
