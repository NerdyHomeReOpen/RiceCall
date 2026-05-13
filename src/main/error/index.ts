import { modules } from '@/main/modules';

export const error = {
  submit: (errorId: string, error: Error): void => {
    modules.default.errorSubmit(errorId, error);
  },
};
