import { z } from 'zod';

export const RefreshServerMemberApplicationsSchema = z
  .object({
    serverId: z.string(),
  })
  .strict();
