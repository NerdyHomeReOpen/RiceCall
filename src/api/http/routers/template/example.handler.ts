// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Schemas
import { ExampleSchema } from '@/api/http/routers/template/example.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const ExampleHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { example } = await new DataValidator(
        ExampleSchema,
        'EXAMPLE',
      ).validate(data);

      // TODO: implement logic

      return {
        statusCode: 200,
        message: 'success',
        data: {}, // TODO: implement data
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

      new Logger('Example').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};
