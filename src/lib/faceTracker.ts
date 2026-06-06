import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

export function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
      );
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
    })();
  }
  return landmarkerPromise;
}

export type FaceMetrics = {
  faceDetected: boolean;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  eyeContactScore: number;
  mouthOpenScore: number;
  smileScore: number;
  emotion: EmotionLabel;
  confidenceScore: number;
};

export const defaultMetrics: FaceMetrics = {
  faceDetected: false,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  eyeContactScore: 0,
  mouthOpenScore: 0,
  smileScore: 0,
  emotion: "Neutral",
  confidenceScore: 0,
};

export type EmotionLabel =
  | "Happy"
  | "Neutral"
  | "Focused"
  | "Distracted"
  | "Surprised"
  | "Confident";

// Extract yaw/pitch/roll (degrees) from a 4x4 column-major transformation matrix
function eulerFromMatrix(m: number[]): { yaw: number; pitch: number; roll: number } {
  // column-major: m[col*4 + row]
  const r00 = m[0],
    r10 = m[1],
    r20 = m[2];
  const r21 = m[6];
  const r22 = m[10];
  const pitch = Math.atan2(-r20, Math.sqrt(r00 * r00 + r10 * r10));
  const yaw = Math.atan2(r10, r00);
  const roll = Math.atan2(r21, r22);
  const d = 180 / Math.PI;
  return { yaw: yaw * d, pitch: pitch * d, roll: roll * d };
}

function getBlend(result: FaceLandmarkerResult, name: string): number {
  const cat = result.faceBlendshapes?.[0]?.categories;
  if (!cat) return 0;
  const item = cat.find((c) => c.categoryName === name);
  return item ? item.score : 0;
}

export function metricsFromResult(result: FaceLandmarkerResult): FaceMetrics {
  // console.log(result.faceBlendshapes?.[0]?.categories);
  const hasFace = (result.faceLandmarks?.length ?? 0) > 0;
  if (!hasFace) return { ...defaultMetrics };

  let yaw = 0,
    pitch = 0,
    roll = 0;
  const matrix = result.facialTransformationMatrixes?.[0]?.data;
  if (matrix && matrix.length === 16) {
    const e = eulerFromMatrix(Array.from(matrix));
    yaw = e.yaw;
    pitch = e.pitch;
    roll = e.roll;
  }

  // Eye contact: high when head facing camera AND eyes not looking far away
  const lookOut =
    getBlend(result, "eyeLookOutLeft") +
    getBlend(result, "eyeLookOutRight") +
    getBlend(result, "eyeLookInLeft") +
    getBlend(result, "eyeLookInRight") +
    getBlend(result, "eyeLookUpLeft") +
    getBlend(result, "eyeLookUpRight") +
    getBlend(result, "eyeLookDownLeft") +
    getBlend(result, "eyeLookDownRight");
  const headOffset = Math.min(1, (Math.abs(yaw) / 30) * 0.6 + (Math.abs(pitch) / 25) * 0.4);
  const eyeMovement = Math.min(1, lookOut / 4);
  //const headOffset = Math.min(1, (Math.abs(yaw) + Math.abs(pitch)) / 45);
  const smileLeft = getBlend(result, "mouthSmileLeft");
  const smileRight = getBlend(result, "mouthSmileRight");
  const smileScore = (smileLeft + smileRight) / 2;
  const smileBonus = Math.min(0.1, smileScore * 0.1);
  const eyeContactScore = Math.max(
    0,
    Math.min(1, 1 - headOffset * 0.5 - eyeMovement * 0.5 + smileBonus),
  );

  //const eyeContactScore = Math.max(0, Math.min(1, 1 - headOffset - lookOut / 8));

  const mouthOpenBlend = getBlend(result, "mouthOpen");
  const jawOpenBlend = getBlend(result, "jawOpen");
  const mouthOpenScore = Math.min(1, (jawOpenBlend * 0.6 + mouthOpenBlend * 0.4) * 1.5);

  // const smileScore = Math.min(
  //   1,
  //   getBlend(result, "mouthSmileLeft") + getBlend(result, "mouthSmileRight"),
  // );
  const confidenceScore = eyeContactScore * 0.6 + smileScore * 0.4;

  let emotion: EmotionLabel = "Neutral";

  if (smileScore > 0.6) {
    emotion = "Happy";
  } else if (mouthOpenScore > 0.6 && getBlend(result, "browInnerUp") > 0.3) {
    emotion = "Surprised";
  } else if (eyeContactScore > 0.7 && smileScore > 0.2 && Math.abs(yaw) < 15) {
    emotion = "Confident";
  } else if (eyeContactScore > 0.8 && Math.abs(yaw) < 10 && Math.abs(pitch) < 10) {
    emotion = "Focused";
  } else if (eyeContactScore < 0.4) {
    emotion = "Distracted";
  }

  return {
    faceDetected: true,
    headYaw: yaw,
    headPitch: pitch,
    headRoll: roll,
    eyeContactScore,
    mouthOpenScore,
    smileScore,
    emotion,
    confidenceScore,
  };
}
