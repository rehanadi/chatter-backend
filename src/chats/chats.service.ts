import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChatInput } from './dto/create-chat.input';
import { UpdateChatInput } from './dto/update-chat.input';
import { ChatsRepository } from "./chats.repository";
import { PipelineStage, Types } from "mongoose";
import { PaginationArgs } from "src/common/dto/pagination-args.dto";
import { UsersService } from "src/users/users.service";

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly usersService: UsersService,
  ) {}

  // userChatFilter(userId: string) {
  //   return {
  //     $or: [
  //       { userId },
  //       {
  //         userIds: {
  //           $in: [userId],
  //         },
  //       },
  //       { isPrivate: false },
  //     ],
  //   };
  // }

  async create(createChatInput: CreateChatInput, userId: string) {
    return this.chatsRepository.create({
      ...createChatInput,
      userId,
      messages: [],
    });
  }

  async findMany(
    prePipelineStages: PipelineStage[] = [],
    paginationArgs?: PaginationArgs,
  ) {
    const chats = await this.chatsRepository.model.aggregate([
      ...prePipelineStages,
      {
        $set: {
          latestMessage: {
            $cond: [
              '$messages',
              { $arrayElemAt: ['$messages', -1] },
              { createdAt: new Date() },
            ],
          },
        },
      },
      { $sort: { 'latestMessage.createdAt': -1 } },
      { $skip: paginationArgs?.skip ?? 0 },
      { $limit: paginationArgs?.limit ?? 15 },
      { $unset: 'messages' },
      {
        $lookup: {
          from: 'users',
          localField: 'latestMessage.userId',
          foreignField: '_id',
          as: 'latestMessage.user',
        },
      },
    ]);

    chats.forEach((chat) => {
      if (!chat.latestMessage?._id) {
        delete chat.latestMessage; // Remove latestMessage if it doesn't exist
        return;
      }

      chat.latestMessage.user = this.usersService.toEntity(chat.latestMessage.user[0]); // Get the first user from the array
      delete chat.latestMessage.userId; // Remove userId from latestMessage
      chat.latestMessage.chatId = chat._id; // Add chatId to latestMessage
    });

    return chats;
  }

  async findOne(_id: string) {
    const chats = await this.findMany([
      { $match: { _id: new Types.ObjectId(_id) } },
    ]);

    if (!chats[0]) {
      throw new NotFoundException(`Chat with ID ${_id} not found`);
    }

    return chats[0];
  }

  async countChats() {
    return this.chatsRepository.model.countDocuments({});
  }

  update(id: number, updateChatInput: UpdateChatInput) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
