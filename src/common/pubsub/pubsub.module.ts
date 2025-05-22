import { Global, Module } from "@nestjs/common";
import { PUB_SUB } from "../constants/injection-tokens";
import { PubSub } from "graphql-subscriptions";
import { ConfigService } from "@nestjs/config";
import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";
import { reviver } from "./reviver.util";

// The @Global() decorator ensures this module is available application-wide without needing to import it in every module that needs pub/sub functionality
@Global()
@Module({
  providers: [
    {
      provide: PUB_SUB, // Creates a singleton PubSub instance from the graphql-subscriptions package
      useFactory: (configService: ConfigService) => {
        if (configService.get("NODE_ENV") === "production") {
          const options = {
            host: configService.getOrThrow("REDIS_HOST"),
            port: configService.getOrThrow("REDIS_PORT"),
          };

          return new RedisPubSub({
            publisher: new Redis(options), // Creates a Redis client for publishing messages
            subscriber: new Redis(options), // Creates a Redis client for subscribing to messages
            reviver: reviver, // Handle message serialization/deserialization
          });
        }

        return new PubSub(); // Creates a local PubSub instance for development/testing
      },
      inject: [ConfigService],
    }
  ],
  exports: [PUB_SUB], // Makes the PubSub service available to be injected in other modules
})
export class PubSubModule {}