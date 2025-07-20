// Services
import ipcService from '@/services/ipc.service';

// Types
import { PopupType } from '@/types';

export default class ErrorHandler {
  message: string;
  handler?: () => void;

  constructor(error: Error, handler?: () => void) {
    this.message = error.message;
    this.handler = handler || (() => {});
  }

  show() {
    ipcService.popup.open(PopupType.DIALOG_ERROR, 'errorDialog');
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
