import type { FaceMetrics } from "../faceTracker";

export type SaveInterviewMetricsPayload = {
  sessionId: string;
  durationSeconds?: number;
} & FaceMetrics;

export async function saveInterviewMetricsToApi(
  payload: SaveInterviewMetricsPayload,
): Promise<{ id: string; sessionId: string; createdAt: string }> {
  const response = await fetch("/api/interviews/metrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: payload.sessionId,
      faceDetected: payload.faceDetected,
      headYaw: payload.headYaw,
      headPitch: payload.headPitch,
      headRoll: payload.headRoll,
      eyeContactScore: payload.eyeContactScore,
      mouthOpenScore: payload.mouthOpenScore,
      smileScore: payload.smileScore,
      confidenceScore: payload.confidenceScore,
      emotion: payload.emotion,
      durationSeconds: payload.durationSeconds,
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to save interview metrics");
  }
  return body;
}
