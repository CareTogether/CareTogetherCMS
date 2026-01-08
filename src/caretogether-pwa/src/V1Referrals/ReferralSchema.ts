import { z } from 'zod';

export const addReferralSchema = z.object({
  openedAtLocal: z.date(),
  title: z.string().min(1, 'Referral title is required'),
  familyId: z.string().nullable(),
  comment: z.string().optional(),

  customFields: z.record(z.string(), z.any()).optional(),
});

export type AddReferralFormValues = z.infer<typeof addReferralSchema>;
