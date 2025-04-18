// Services
import ipcService from '@/services/ipc.service';

// Types
import { PopupType } from '@/types';

export class StandardizedError extends Error {
  constructor(
    public name: string = 'Error',
    public error_message: string = 'An error occurred',
    public part: string = 'UNKNOWN_PART',
    public tag: string = 'UNKNOWN_ERROR',
    public status_code: number = 500,
    public timestamp: number = Date.now(),
    title: string = 'Error',
    public handler: () => void = () => {},
  ) {
    super(title);
  }
}

export class errorHandler {
  error: StandardizedError;

  constructor(error: StandardizedError) {
    this.error = error;
  }

  show() {
    const errorMessage = `(${new Date(
      this.error.timestamp,
    ).toLocaleString()}) [錯誤][${this.error.tag}] ${
      this.error.error_message
    }，錯誤代碼: ${this.error.status_code} (${this.error.part})`;

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
