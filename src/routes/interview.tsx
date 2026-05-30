import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Square, Camera, Eye, Smile, Clock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/interview")({
  component: InterviewPage,
});

const EMOTIONS = ["Confident", "Neutral", "Engaged", "Thoughtful", "Calm"];

function InterviewPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [duration, setDuration] = useState(90);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [camOn, setCamOn] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [looking, setLooking] = useState(false);
  const [emotion, setEmotion] = useState("Neutral");

  // start camera on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamOn(true);
      } catch {
        setCamOn(false);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // timer + mock detection
  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= duration) {
          clearInterval(tick);
          setRunning(false);
          setTimeout(() => navigate({ to: "/result" }), 400);
          return duration;
        }
        return e + 1;
      });
      setFaceDetected(Math.random() > 0.05);
      setLooking(Math.random() > 0.2);
      if (Math.random() > 0.6) setEmotion(EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)]);
    }, 1000);
    return () => clearInterval(tick);
  }, [running, duration, navigate]);

  const toggle = () => {
    if (running) {
      setRunning(false);
      navigate({ to: "/result" });
    } else {
      setElapsed(0);
      setRunning(true);
    }
  };

  const remaining = duration - elapsed;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = (elapsed / duration) * 100;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${running ? "animate-pulse bg-destructive" : "bg-muted-foreground/40"}`} />
          {running ? "Recording" : "Idle"}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 pb-16 lg:grid-cols-[1fr_320px]">
        {/* Video */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="aspect-video bg-black">
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
                    <p className="mt-3 text-sm text-muted-foreground">Allow camera access to begin</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timer overlay */}
            <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-background/60 px-3 py-1.5 text-sm font-medium backdrop-blur">
              <Clock className="h-3.5 w-3.5" />
              {mm}:{ss}
            </div>

            {/* Progress bar */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-background/40">
              <div className="h-full bg-[image:var(--gradient-primary)] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Duration</label>
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
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                running
                  ? "bg-destructive text-destructive-foreground hover:opacity-90"
                  : "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02]"
              }`}
            >
              {running ? <><Square className="h-4 w-4" /> Stop Interview</> : <><Play className="h-4 w-4" /> Start Interview</>}
            </button>
          </div>
        </div>

        {/* Status sidebar */}
        <aside className="space-y-3">
          <h2 className="px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Live status</h2>
          <StatusRow icon={<Camera className="h-4 w-4" />} label="Face detected" value={faceDetected ? "Yes" : "No"} ok={faceDetected} />
          <StatusRow icon={<Eye className="h-4 w-4" />} label="Looking at camera" value={looking ? "Yes" : "Off-center"} ok={looking} />
          <StatusRow icon={<Smile className="h-4 w-4" />} label="Emotion" value={emotion} ok />

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

function StatusRow({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary">{icon}</div>
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-[color:var(--success)]" : "bg-destructive"}`} />
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}
