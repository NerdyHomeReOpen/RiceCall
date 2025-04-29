import { z } from 'zod';

export const UploadSchema = z
  .object({
    _type: z.string(),
    _fileName: z.string(),
    _file: z.string(),
  })
  .strict();
