import { User } from "src/users/entities/user.entity";

// Change _id from ObjectId to string
export type TokenPayload = Omit<User, "_id"> & { _id: string };