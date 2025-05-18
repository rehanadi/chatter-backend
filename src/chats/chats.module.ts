import { forwardRef, Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsResolver } from './chats.resolver';
import { ChatsRepository } from "./chats.repository";
import { DatabaseModule } from "src/common/database/database.module";
import { Chat } from "./entities/chat.entity";
import { ChatSchema } from "./entities/chat.schema";
import { MessagesModule } from './messages/messages.module';
import { ChatsController } from './chats.controller';

@Module({
  imports: [
    DatabaseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
    ]),
    forwardRef(() => MessagesModule),
  ],
  providers: [ChatsResolver, ChatsService, ChatsRepository],
  exports: [ChatsRepository],
  controllers: [ChatsController],
})
export class ChatsModule {}
