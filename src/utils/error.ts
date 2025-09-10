// Services
import ipc from '@/services/ipc.service';

export default class ErrorHandler {
  message: string;
  handler?: () => void;

  constructor(error: Error, handler?: () => void) {
    this.message = error.message;
    this.handler = handler || (() => {});
  }

  show() {
    ipc.popup.open('dialogError', 'errorDialog', {
      message: this.message,
      submitTo: 'errorDialog',
      timestamp: Date.now(),
    });
    ipc.popup.onSubmit('errorDialog', () => {
      if (this.handler) this.handler();
    });
  }
}
