import { z } from 'zod';

export const editReferralSchema = z.object({
  openedAtLocal: z.date(),
  title: z.string().min(1),
  familyId: z.string().nullable(),
  comment: z.string().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

export type EditReferralFormValues = z.infer<typeof editReferralSchema>;
