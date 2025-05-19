import { Field, ObjectType } from "@nestjs/graphql";
import { AbstractEntity } from "src/common/database/abstract.entity";

@ObjectType() // This decorator is used to mark the class as a GraphQL object type
// It'll inherit _id field from abstract entity
export class User extends AbstractEntity {
  @Field()
  email: string;

  @Field()
  username: string;

  @Field()
  imageUrl: string;
}