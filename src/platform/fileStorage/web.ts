/* eslint-disable @typescript-eslint/no-unused-vars */
export const FileStorage = {
  store: async (buffer: ArrayBuffer, _directory: string, _filenamePrefix: string, _extension: string): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const blob = new Blob([buffer]);
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          resolve(null);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        resolve(null);
      }
    });
  }
};
