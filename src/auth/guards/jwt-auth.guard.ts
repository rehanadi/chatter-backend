import { AuthGuard } from "@nestjs/passport";

// REST API JWT Authentication Guard
export class JwtAuthGuard extends AuthGuard('jwt') {}