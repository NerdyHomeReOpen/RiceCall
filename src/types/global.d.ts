// src/types/electron.d.ts
export {};

declare global {
  interface Window {
    electron?: {
      desktopCapturer?: {
        getSources: (opts: {
          types: Array<'screen' | 'window'>;
          thumbnailSize?: { width: number; height: number };
          fetchWindowIcons?: boolean;
        }) => Promise<Array<{
          id: string;
          name: string;
          // añade lo que necesites (thumbnails, etc.)
        }>>;
      };
    };
  }
}
