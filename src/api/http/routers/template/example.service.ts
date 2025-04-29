// Error
import StandardizedError from '@/error';

// Database
import Database from '@/src/database';

export default class ExampleService {
  // TODO: change service name
  constructor(private example: any) {
    this.example = example; // TODO: change example
  }

  async use() {
    try {
      // TODO: implement service logic
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: '', // TODO: implement error message
        part: '', // TODO: implement part
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
