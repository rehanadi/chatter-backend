import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { TokenPayload } from "../token-auth.interface";
import { getJwt } from "../jwt.util";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          if (request.cookies.Authentication) {
            return request.cookies.Authentication;
          }

          return getJwt(request.headers.authorization || "");
        },
      ]),
      secretOrKey: configService.getOrThrow("JWT_SECRET"),
    });
  }

  // Automatically adds the user to the request object
  validate(payload: TokenPayload) {
    return payload;
  }
}