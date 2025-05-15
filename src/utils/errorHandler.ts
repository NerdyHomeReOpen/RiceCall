// Services
import ipcService from '@/services/ipc.service';

// Types
import { PopupType } from '@/types';

type StandardizedErrorOptions = Error & {
  name: string;
  part: string;
  tag: string;
  statusCode: number;
  handler?: () => void;
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
    this.handler = options.handler;
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
    console.error(
      `[${this.error.tag}] ${this.error.message} (${this.error.statusCode}) (${
        this.error.part
      }) (${new Date().toLocaleString()})`,
    );
    const errorMessage = `${this.error.message} (${this.error.statusCode})`;

    ipcService.popup.open(PopupType.DIALOG_ERROR, 'errorDialog');
    ipcService.popup.onSubmit('errorDialog', () => {
      if (this.error.handler) this.error.handler();
    });
    ipcService.initialData.onRequest('errorDialog', {
      title: errorMessage,
      submitTo: 'errorDialog',
    });
  }
}
