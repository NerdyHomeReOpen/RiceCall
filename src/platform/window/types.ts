/**
 * Platform Window Types
 * 
 * Unified window control interface for both Electron and Web platforms.
 */

export interface WindowController {
  resize(width: number, height: number): void;
  minimize(): void;
  maximize(): void;
  unmaximize(): void;
  close(): void;
  onMaximize(callback: () => void): () => void;
  onUnmaximize(callback: () => void): () => void;
}
