import { Logger, NotFoundException } from "@nestjs/common";
import { AbstractDocument } from "./abstract.schema";
import { FilterQuery, Model, Types, UpdateQuery } from "mongoose";

// TDocument represents the specific Mongoose document type that will be used with this repository.
// So inside the generic AbstractRepository, methods like create, findOne, or findOneAndUpdate will all automatically know the shape of the document
export abstract class AbstractRepository<TDocument extends AbstractDocument> {
  protected abstract readonly logger: Logger;

  constructor(protected readonly model: Model<TDocument>) {}

  // Omit will creates a new type based on TDocument but excludes the _id field
  async create(document: Omit<TDocument, "_id">): Promise<TDocument> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });

    return (await createdDocument.save()).toJSON() as unknown as TDocument;
  }

  async findOne(filterQuery: FilterQuery<TDocument>): Promise<TDocument> {
    // Use lean to get a plain JavaScript object without Mongoose methods
    const document = await this.model.findOne(filterQuery).lean<TDocument>();

    if (!document) {
      this.logger.warn(`Document was not found with filter: ${JSON.stringify(filterQuery)}`);
      throw new NotFoundException("Document not found");
    }

    return document;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
  ): Promise<TDocument> {
    const document = await this.model.findOneAndUpdate(filterQuery, update, {
      new: true, // Return new document
    }).lean<TDocument>();

    if (!document) {
      this.logger.warn(`Document was not found with filter: ${JSON.stringify(filterQuery)}`);
      throw new NotFoundException("Document not found");
    }

    return document;
  }

  async findAll(filterQuery: FilterQuery<TDocument>): Promise<TDocument[]> {
    return this.model.find(filterQuery).lean<TDocument[]>();
  }

  async findOneAndDelete(filterQuery: FilterQuery<TDocument>): Promise<TDocument> {
    const document = await this.model.findOneAndDelete(filterQuery).lean<TDocument>();

    if (!document) {
      this.logger.warn(`Document was not found with filter: ${JSON.stringify(filterQuery)}`);
      throw new NotFoundException("Document not found");
    }

    return document;
  }
}