import type * as Types from '@/types';

export type PopupId = string;

export interface PopupOpenOptions {
  force?: boolean;
  title?: string;
}

export interface PopupController {
  open(type: Types.PopupType, id: PopupId, initialData: unknown, options?: PopupOpenOptions): void;
  close(id: PopupId): void;
  closeAll(): void;

  /**
   * Send data from popup -> host (or between popups) using the existing submit semantics.
   */
  submit(to: PopupId, data?: unknown): void;

  /**
   * Subscribe to submit events targeted at `host`.
   * Returns an unsubscribe function.
   */
  onSubmit<T>(host: PopupId, callback: (data: T) => void): () => void;
}
