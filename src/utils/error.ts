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
    const errorMessage = `${this.message} (${new Date().toLocaleString()})`;

    ipcService.popup.open(PopupType.DIALOG_ERROR, 'errorDialog');
    ipcService.popup.onSubmit('errorDialog', () => {
      if (this.handler) this.handler();
    });
    ipcService.initialData.onRequest('errorDialog', {
      title: errorMessage,
      submitTo: 'errorDialog',
    });
  }
}
