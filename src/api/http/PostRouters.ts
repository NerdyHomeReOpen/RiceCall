// Error
import RouteNotFoundError from '@/errors/RouteNotFoundError';

// Http
import { ResponseType } from '@/api/http';
import { RequestHandler } from '@/handler';

interface PostRoutes {
  [key: string]: RequestHandler;
}

export class PostRouters {
  static routes: PostRoutes = {};

  static addRoute(path: string, handler: RequestHandler): void {
    if (PostRouters.routes[path]) {
      throw new Error(`Route already exists: ${path}`);
    }
    PostRouters.routes[path] = handler;
  }

  static async handle(path: string, data: any): Promise<ResponseType> {
    const handler = PostRouters.routes[path];
    if (handler) return await handler.handle(data);
    throw new RouteNotFoundError('Route not found', path);
  }
}
