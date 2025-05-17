import { Logger, NotFoundException } from "@nestjs/common";
import { AbstractEntity } from "./abstract.entity";
import { FilterQuery, Model, Types, UpdateQuery } from "mongoose";

// T represents the specific Mongoose document type that will be used with this repository.
// So inside the generic AbstractRepository, methods like create, findOne, or findOneAndUpdate will all automatically know the shape of the document
export abstract class AbstractRepository<T extends AbstractEntity> {
  protected abstract readonly logger: Logger;

  constructor(public readonly model: Model<T>) {}

  // Omit will creates a new type based on T but excludes the _id field
  async create(document: Omit<T, "_id">): Promise<T> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });

    return (await createdDocument.save()).toJSON() as unknown as T;
  }

  async findOne(filterQuery: FilterQuery<T>): Promise<T> {
    // Use lean to get a plain JavaScript object without Mongoose methods
    const document = await this.model.findOne(filterQuery).lean<T>();

    if (!document) {
      this.logger.warn(`Document was not found with filter: ${JSON.stringify(filterQuery)}`);
      throw new NotFoundException("Document not found");
    }

    return document;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<T>,
    update: UpdateQuery<T>,
  ): Promise<T> {
    const document = await this.model.findOneAndUpdate(filterQuery, update, {
      new: true, // Return new document
    }).lean<T>();

    if (!document) {
      this.logger.warn(`Document was not found with filter: ${JSON.stringify(filterQuery)}`);
      throw new NotFoundException("Document not found");
    }

    return document;
  }

  async findAll(filterQuery: FilterQuery<T>): Promise<T[]> {
    return this.model.find(filterQuery).lean<T[]>();
  }

  async findOneAndDelete(filterQuery: FilterQuery<T>): Promise<T> {
    const document = await this.model.findOneAndDelete(filterQuery).lean<T>();

    if (!document) {
      this.logger.warn(`Document was not found with filter: ${JSON.stringify(filterQuery)}`);
      throw new NotFoundException("Document not found");
    }

    return document;
  }
}