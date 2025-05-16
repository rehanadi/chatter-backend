import { Global, Module } from "@nestjs/common";
import { PUB_SUB } from "../constants/injection-tokens";
import { PubSub } from "graphql-subscriptions";

// The @Global() decorator ensures this module is available application-wide without needing to import it in every module that needs pub/sub functionality
@Global()
@Module({
  providers: [
    {
      provide: PUB_SUB, // Creates a singleton PubSub instance from the graphql-subscriptions package
      useValue: new PubSub(),
    }
  ],
  exports: [PUB_SUB], // Makes the PubSub service available to be injected in other modules
})
export class PubSubModule {}