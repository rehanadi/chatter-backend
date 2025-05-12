// This file combines the User entity for GraphQL and schema for MongoDB using Mongoose.
import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { AbstractEntity } from "src/common/database/abstract.entity";

@Schema({ versionKey: false })
@ObjectType() // This decorator is used to mark the class as a GraphQL object type
// It'll inherit _id field from abstract entity
export class User extends AbstractEntity {
  @Prop()
  @Field()
  email: string;

  @Prop()
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User); 