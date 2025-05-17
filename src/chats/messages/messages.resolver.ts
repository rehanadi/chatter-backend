import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { MessagesService } from './messages.service';
import { Message } from "./entities/message.entity";
import { UseGuards } from "@nestjs/common";
import { GqlAuthGuard } from "src/auth/guards/gql-auth.guard";
import { CreateMessageInput } from "./dto/create-message.input";
import { CurrentUser } from "src/auth/current-user.decorator";
import { TokenPayload } from "src/auth/token-auth.interface";
import { GetMessagesArgs } from "./dto/get-messages.args";
import { MessageCreatedArgs } from "./dto/message-created.args";

@Resolver(() => Message)
export class MessagesResolver {
  constructor(
    private readonly messagesService: MessagesService,
  ) {}

  @Mutation(() => Message)
  @UseGuards(GqlAuthGuard)
  async createMessage(
    @Args('createMessageInput') createMessageInput: CreateMessageInput,
    @CurrentUser() user: TokenPayload,
  ): Promise<Message> {
    return this.messagesService.createMessage(createMessageInput, user._id);
  }

  @Query(() => [Message], { name: 'messages' })
  @UseGuards(GqlAuthGuard)
  async getMessages(
    @Args() getMessageArgs: GetMessagesArgs,
  ): Promise<Message[]> {
    return this.messagesService.getMessages(getMessageArgs);
  }

  @Subscription(() => Message, {
    // payload from the return value of the publish function
    // variables from the args
    // messageCreated: subscription name
    filter: (payload, variables, context) => {
      const userId = context.req.user._id;
      const message: Message = payload.messageCreated;

      return (
        message.chatId === variables.chatId &&
        message.user._id.toHexString() !== userId
      );
    }
  })
  messageCreated(
    @Args() messageCreatedArgs: MessageCreatedArgs,
  ) {
    return this.messagesService.messageCreated(messageCreatedArgs);
  }
}
