// Services
import ipcService from '@/services/ipc.service';

export default class ErrorHandler {
  message: string;
  handler?: () => void;

  constructor(error: Error, handler?: () => void) {
    this.message = error.message;
    this.handler = handler || (() => {});
  }

  show() {
    ipcService.popup.open('dialogError', 'errorDialog');
    ipcService.popup.onSubmit('errorDialog', () => {
      if (this.handler) this.handler();
    });
    ipcService.initialData.onRequest('errorDialog', {
      message: this.message,
      submitTo: 'errorDialog',
      timestamp: Date.now(),
    });
  }
}
