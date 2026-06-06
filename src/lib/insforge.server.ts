import { createAdminClient } from "@insforge/sdk";

import type { EmotionLabel } from "./faceTracker";

export type InterviewRow = {
  id: string;
  session_id: string;
  user_id: string | null;
  face_detected: boolean;
  head_yaw: number;
  head_pitch: number;
  head_roll: number;
  eye_contact_score: number;
  mouth_open_score: number;
  smile_score: number;
  confidence_score: number | null;
  emotion: EmotionLabel;
  duration_seconds: number | null;
  created_at: string;
};

export type SaveInterviewMetricsInput = {
  sessionId: string;
  faceDetected: boolean;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  eyeContactScore: number;
  mouthOpenScore: number;
  smileScore: number;
  confidenceScore?: number;
  emotion: EmotionLabel;
  durationSeconds?: number;
};

let adminClient: ReturnType<typeof createAdminClient> | null = null;

function getAdminClient() {
  if (!adminClient) {
    const baseUrl = process.env.INSFORGE_URL;
    const apiKey = process.env.INSFORGE_API_KEY;
    if (!baseUrl || !apiKey) {
      throw new Error("Missing INSFORGE_URL or INSFORGE_API_KEY");
    }
    adminClient = createAdminClient({ baseUrl, apiKey });
  }
  return adminClient;
}

export async function saveInterviewMetrics(input: SaveInterviewMetricsInput) {
  const { data, error } = await getAdminClient()
    .database.from("interviews")
    .insert([
      {
        session_id: input.sessionId,
        face_detected: input.faceDetected,
        head_yaw: input.headYaw,
        head_pitch: input.headPitch,
        head_roll: input.headRoll,
        eye_contact_score: input.eyeContactScore,
        mouth_open_score: input.mouthOpenScore,
        smile_score: input.smileScore,
        confidence_score: input.confidenceScore ?? null,
        emotion: input.emotion,
        duration_seconds: input.durationSeconds ?? null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as InterviewRow;
}
