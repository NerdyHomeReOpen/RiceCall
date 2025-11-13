export default class ErrorHandler {
  message: string;
  handler?: () => void;

  constructor(error: Error, handler?: () => void) {
    this.message = error.message;
    this.handler = handler || (() => {});
  }
}
