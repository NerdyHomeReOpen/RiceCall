// Services
import ipcService from '@/services/ipc.service';

// Types
import { PopupType } from '@/types';

type StandardizedErrorOptions = Error & {
  name: string;
  part: string;
  tag: string;
  statusCode: number;
};

export default class StandardizedError {
  message: string;
  name: string;
  part: string;
  tag: string;
  statusCode: number;
  handler?: () => void;

  constructor(options: StandardizedErrorOptions) {
    this.message = options.message;
    this.name = options.name;
    this.part = options.part;
    this.tag = options.tag;
    this.statusCode = options.statusCode;
  }

  handle() {
    if (this.handler) this.handler();
  }
}

export class errorHandler {
  error: StandardizedError;

  constructor(error: StandardizedError) {
    this.error = error;
  }

  show() {
    const errorMessage = `(${new Date().toLocaleString()}) [錯誤][${
      this.error.tag
    }] ${this.error.message}，錯誤代碼: ${this.error.statusCode} (${
      this.error.part
    })`;

    ipcService.popup.open(PopupType.DIALOG_ERROR);
    ipcService.popup.onSubmit('error', () => {
      if (this.error.handler) this.error.handler();
    });
    ipcService.initialData.onRequest(PopupType.DIALOG_ERROR, {
      iconType: 'error',
      title: errorMessage,
      submitTo: 'error',
    });
  }
}
