import { IncomingMessage } from 'http';

// Types
import { ResponseType } from '@/api/http';

export abstract class HttpHandler {
  constructor(protected req: IncomingMessage) {
    this.req = req;
  }

  abstract handle(data: any): Promise<ResponseType>;
}
