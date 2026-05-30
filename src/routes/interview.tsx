import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Square, Camera, Eye, Smile, Clock, ArrowLeft, Gauge } from "lucide-react";
import {
  getFaceLandmarker,
  metricsFromResult,
  defaultMetrics,
  type FaceMetrics,
} from "@/lib/faceTracker";

export const Route = createFileRoute("/interview")({
  component: InterviewPage,
});

function InterviewPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(-1);

  const [duration, setDuration] = useState(90);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [camOn, setCamOn] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [metrics, setMetrics] = useState<FaceMetrics>(defaultMetrics);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
    setMetrics(defaultMetrics);
  };

  const startCamera = async () => {
    setLoadingModel(true);
    try {
      const [stream, landmarker] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false }),
        getFaceLandmarker(),
      ]);
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) resolve();
        else video.onloadeddata = () => resolve();
      });
      await video.play();
      setCamOn(true);

      const loop = () => {
        if (!videoRef.current || !streamRef.current) return;
        const v = videoRef.current;
        const ts = performance.now();
        if (ts !== lastTsRef.current && v.readyState >= 2) {
          lastTsRef.current = ts;
          try {
            const result = landmarker.detectForVideo(v, ts);
            setMetrics(metricsFromResult(result));
          } catch {
            /* ignore frame errors */
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      console.error("Camera/model init failed", e);
      setCamOn(false);
    } finally {
      setLoadingModel(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // timer
  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= duration) {
          clearInterval(tick);
          setRunning(false);
          stopCamera();
          setTimeout(() => navigate({ to: "/result" }), 400);
          return duration;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, duration, navigate]);

  const toggle = async () => {
    if (running) {
      setRunning(false);
      stopCamera();
      navigate({ to: "/result" });
    } else {
      setElapsed(0);
      if (!camOn) await startCamera();
      setRunning(true);
    }
  };

  const remaining = duration - elapsed;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = (elapsed / duration) * 100;

  const looking = metrics.eyeContactScore > 0.55;
  const emotionLabel = metrics.faceDetected ? metrics.emotion : "—";
  // const emotionLabel =
  //   metrics.smileScore > 0.4
  //     ? "Happy"
  //     : metrics.mouthOpenScore > 0.3
  //     ? "Speaking"
  //     : metrics.faceDetected
  //     ? "Neutral"
  //     : "—";

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className={`h-2 w-2 rounded-full ${running ? "animate-pulse bg-destructive" : "bg-muted-foreground/40"}`}
          />
          {running ? "Recording" : "Idle"}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 pb-16 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full -scale-x-100 object-cover"
              />
              {!camOn && (
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <Camera className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      {loadingModel ? "Loading face model…" : "Press Start to enable camera"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-background/60 px-3 py-1.5 text-sm font-medium backdrop-blur">
              <Clock className="h-3.5 w-3.5" />
              {mm}:{ss}
            </div>

            <div className="absolute inset-x-0 bottom-0 h-1 bg-background/40">
              <div
                className="h-full bg-[image:var(--gradient-primary)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Duration
              </label>
              <input
                type="range"
                min={60}
                max={180}
                step={15}
                value={duration}
                disabled={running}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="accent-[color:var(--primary)]"
              />
              <span className="w-12 text-sm font-medium">{duration}s</span>
            </div>
            <button
              onClick={toggle}
              disabled={loadingModel}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                running
                  ? "bg-destructive text-destructive-foreground hover:opacity-90"
                  : "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02]"
              }`}
            >
              {running ? (
                <>
                  <Square className="h-4 w-4" /> Stop Interview
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> {loadingModel ? "Loading…" : "Start Interview"}
                </>
              )}
            </button>
          </div>

          {/* Pose telemetry */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
            <Metric label="Yaw" value={`${metrics.headYaw.toFixed(0)}°`} />
            <Metric label="Pitch" value={`${metrics.headPitch.toFixed(0)}°`} />
            <Metric label="Roll" value={`${metrics.headRoll.toFixed(0)}°`} />
          </div>
        </div>

        <aside className="space-y-3">
          <h2 className="px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Live status
          </h2>
          <div className="rounded-2xl border border-primary/30 bg-card/80 p-5 text-center backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              AI Emotion Analysis
            </p>

            <p className="mt-3 text-3xl font-bold text-primary">
              {metrics.faceDetected ? metrics.emotion : "—"}
            </p>
          </div>
          <StatusRow
            icon={<Camera className="h-4 w-4" />}
            label="Face detected"
            value={metrics.faceDetected ? "Yes" : "No"}
            ok={metrics.faceDetected}
          />
          <StatusRow
            icon={<Eye className="h-4 w-4" />}
            label="Looking at camera"
            value={looking ? "Yes" : "Off-center"}
            ok={looking}
          />
          <StatusRow
            icon={<Smile className="h-4 w-4" />}
            label="Emotion"
            value={emotionLabel}
            ok={metrics.faceDetected}
          />
          <StatusRow
            icon={<Gauge className="h-4 w-4" />}
            label="Eye contact"
            value={`${Math.round(metrics.eyeContactScore * 100)}%`}
            ok={metrics.eyeContactScore > 0.55}
          />
          <StatusRow
            icon={<Smile className="h-4 w-4" />}
            label="Smile"
            value={`${Math.round(metrics.smileScore * 100)}%`}
            ok
          />
          <StatusRow
            icon={<Gauge className="h-4 w-4" />}
            label="Mouth open"
            value={`${Math.round(metrics.mouthOpenScore * 100)}%`}
            ok
          />

          <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Prompt</p>
            <p className="mt-2 text-sm leading-relaxed">
              "Tell me about a time you faced a difficult challenge at work and how you handled it."
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary">
          {icon}
        </div>
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-[color:var(--success)]" : "bg-destructive"}`}
        />
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}
