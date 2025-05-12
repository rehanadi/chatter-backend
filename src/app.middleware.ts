import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class GraphQLCSSMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Only intercept GraphQL playground requests
    if (req.url.includes('/graphql') && !req.headers['content-type']?.includes('application/json')) {
      // Store the original send function
      const originalSend = res.send;
      
      // Override the send function to inject our CSS
      res.send = function(body) {
        if (typeof body === 'string' && body.includes('<html>')) {
          // Inject CSS to hide tooltip
          const modifiedBody = body.replace('</head>', 
            `<style>.CodeMirror-hint-information { display: none !important; }</style></head>`
          );
          return originalSend.call(this, modifiedBody);
        }
        return originalSend.call(this, body);
      };
    }
    next();
  }
}