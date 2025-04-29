// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { ExampleSchema } from '@/api/http/routers/template/example.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import ExampleService from '@/api/http/routers/template/example.service'; // TODO: change service file path

export class ExampleHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new DataValidator(
          ExampleSchema,
          'EXAMPLE',
        ).validate(data);

        const result = await new ExampleService(validated.example).use(); // TODO: change service

        return {
          statusCode: 200,
          message: 'success',
          data: result,
        };
      } catch (error: any) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError({
            name: 'ServerError',
            message: '', // TODO: implement message
            part: '', // TODO: implement part
            tag: 'SERVER_ERROR',
            statusCode: 500,
          });
        }

        return {
          statusCode: error.statusCode,
          message: 'error',
          data: { error: error.message },
        };
      }
    });
    return null;
  }
}
