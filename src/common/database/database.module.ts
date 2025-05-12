import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ModelDefinition, MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
      }),
    }),
  ],
})
export class DatabaseModule {
  // Register models in the module so can be used in repositories
  static forFeature(model: ModelDefinition[]) {
    return MongooseModule.forFeature(model);
  }
}