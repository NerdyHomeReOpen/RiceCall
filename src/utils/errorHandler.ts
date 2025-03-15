import { ipcService } from '@/services/ipc.service';
import { popupType } from '@/types';

export class StandardizedError extends Error {
  constructor(
    public name: string = 'Error',
    public error_message: string = 'An error occurred',
    public part: string = 'UNKNOWN_PART',
    public tag: string = 'UNKNOWN_ERROR',
    public status_code: number = 500,
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
    console.log(error);
  }

  show() {
    const errorMessage = `[錯誤][${this.error.tag}] ${this.error.error_message}，錯誤代碼: ${this.error.status_code} (${this.error.part})`;

    ipcService.popup.open(popupType.DIALOG_ERROR);
    ipcService.popup.onSubmit('error', () => {
      this.error.handler();
      console.log('Error handled.');
    });
    ipcService.initialData.onRequest(popupType.DIALOG_ERROR, {
      iconType: 'error',
      title: errorMessage,
      submitTo: 'error',
    });
  }
}
