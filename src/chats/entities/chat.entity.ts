import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { AbstractEntity } from "../../common/database/abstract.entity";

@Schema()
@ObjectType()
export class Chat extends AbstractEntity {
  @Field()
  @Prop()
  userId: string;

  @Field()
  @Prop()
  isPrivate: boolean;

  @Field(() => [String])
  @Prop([String])
  userIds: string[];

  @Field({ nullable: true })
  @Prop()
  name?: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);