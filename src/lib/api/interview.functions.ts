import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { saveInterviewMetrics } from "../insforge.server";

const emotionSchema = z.enum([
  "Happy",
  "Neutral",
  "Focused",
  "Distracted",
  "Surprised",
  "Confident",
]);

export const interviewMetricsSchema = z.object({
  sessionId: z.string().uuid(),
  faceDetected: z.boolean(),
  headYaw: z.number(),
  headPitch: z.number(),
  headRoll: z.number(),
  eyeContactScore: z.number().min(0).max(1),
  mouthOpenScore: z.number().min(0).max(1),
  smileScore: z.number().min(0).max(1),
  confidenceScore: z.number().min(0).max(1).optional(),
  emotion: emotionSchema,
  durationSeconds: z.number().int().positive().optional(),
});

export function parseInterviewMetricsBody(body: unknown) {
  return interviewMetricsSchema.parse(body);
}

export const saveInterviewMetricsFn = createServerFn({ method: "POST" })
  .inputValidator(interviewMetricsSchema)
  .handler(async ({ data }) => {
    const row = await saveInterviewMetrics(data);
    return { id: row.id, sessionId: row.session_id, createdAt: row.created_at };
  });
