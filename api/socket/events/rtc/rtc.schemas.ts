import { z } from 'zod';

export const RTCOfferSchema = z
  .object({
    to: z.string(),
    offer: z.any(),
  })
  .strict();

export const RTCAnswerSchema = z
  .object({
    to: z.string(),
    answer: z.any(),
  })
  .strict();

export const RTCCandidateSchema = z
  .object({
    to: z.string(),
    candidate: z.any(),
  })
  .strict();

export const RTCJoinSchema = z
  .object({
    channelId: z.string(),
  })
  .strict();

export const RTCLeaveSchema = z
  .object({
    channelId: z.string(),
  })
  .strict();
