import { Logger, MiddlewareConsumer, Module, RequestMethod, UnauthorizedException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as Joi from "joi";
import { DatabaseModule } from "./common/database/database.module";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { UsersModule } from './users/users.module';
import { GraphQLCSSMiddleware } from './app.middleware';
import { LoggerModule } from "nestjs-pino";
import { AuthModule } from './auth/auth.module';
import { ChatsModule } from './chats/chats.module';
import { PubSubModule } from "./common/pubsub/pubsub.module";
import { Request } from "express";
import { AuthService } from "./auth/auth.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (authService: AuthService) => ({
        autoSchemaFile: true,
        cors: true,
        path: '/api/graphql',
        subscriptions: {
          'graphql-ws': {
            path: '/api/graphql',
            onConnect: (context: any) => {
              try {
                const request: Request = context.extra.request;
                
                const user = authService.verifyWs(
                  request,
                  context.connectionParams, // set from the client
                );
                
                context.user = user;
              } catch (err) {
                new Logger().error(err);
                throw new UnauthorizedException();
              }
            },
          },
        },
      }),
      imports: [AuthModule],
      inject: [AuthService],
    }),
    LoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            transport: isProduction
              ? undefined
              : {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                },
              },
            level: isProduction ? 'info' : 'debug',
          },
        }
      },
      inject: [ConfigService],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ChatsModule,
    PubSubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GraphQLCSSMiddleware)
      .forRoutes({ path: '/graphql', method: RequestMethod.GET });
  }
}
