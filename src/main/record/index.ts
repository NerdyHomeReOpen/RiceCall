import { modules } from '@/main/modules';

export const record = {
  save: (record: ArrayBuffer): void => {
    modules.default.saveRecord(record);
  },

  savePath: {
    select: async (): Promise<string | null> => {
      return await modules.default.selectRecordSavePath();
    },
  },
};
