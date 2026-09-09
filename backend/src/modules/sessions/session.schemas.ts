/**
 * WebOS Backend - Session Request Schemas (Zod)
 */

import { z } from 'zod';

export const RevokeSessionParamsSchema = z.object({
  id: z.string().min(1, 'Session ID is required')
});

export type RevokeSessionParams = z.infer<typeof RevokeSessionParamsSchema>;
