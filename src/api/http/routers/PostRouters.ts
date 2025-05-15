import { Handler } from '@/handler';
import { ResponseType } from '..';
import RouteNotFoundError from '@/errors/RouteNotFoundError';

interface PostRoutes {
  [key: string]: Handler;
}

export class PostRouters {
  static routes: PostRoutes = {};
  static addRoute(path: string, handler: Handler): void {
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
