import { createFileRoute, Link } from "@tanstack/react-router";
import { RotateCcw, Sparkles, TrendingUp, Eye, MessageSquare, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/result")({
  component: ResultPage,
});

const scores = [
  { label: "Confidence", value: 82, icon: TrendingUp, hint: "Strong, steady tone" },
  { label: "Eye contact", value: 74, icon: Eye, hint: "Good — minor drift" },
  { label: "Clarity", value: 88, icon: MessageSquare, hint: "Clear articulation" },
];

const overall = Math.round(scores.reduce((a, s) => a + s.value, 0) / scores.length);

function ResultPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="text-xs text-muted-foreground">Session #A1042 · 1m 30s</div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="rounded-3xl border border-border bg-card/60 p-8 shadow-[var(--shadow-card)] backdrop-blur md:p-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Overall performance</p>
              <h1 className="mt-2 text-5xl font-bold md:text-6xl">
                {overall}<span className="text-2xl text-muted-foreground">/100</span>
              </h1>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Solid interview. You showed strong clarity with room to improve eye contact.
              </p>
            </div>
            <Link
              to="/interview"
              className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02]"
            >
              <RotateCcw className="h-4 w-4" /> Retry Interview
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {scores.map(({ label, value, icon: Icon, hint }) => (
            <div key={label} className="rounded-2xl border border-border bg-card/60 p-6 shadow-[var(--shadow-card)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </div>
              <p className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-1 text-4xl font-bold">{value}<span className="text-lg text-muted-foreground">/100</span></p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-[image:var(--gradient-primary)]" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card/60 p-6 shadow-[var(--shadow-card)] backdrop-blur md:p-8">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-primary)]">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-semibold">AI Feedback</h2>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              <span className="text-foreground">Strengths.</span> Your delivery was articulate and well-paced.
              You opened with a clear context, walked through the conflict, and finished with measurable
              impact — a textbook STAR structure.
            </p>
            <p>
              <span className="text-foreground">Improve.</span> Your gaze drifted off-camera roughly 26% of the
              time, often when recalling details. Try keeping a sticky note near the lens. Filler words
              ("um", "like") appeared 9 times — slow down at transitions to cut them.
            </p>
            <p>
              <span className="text-foreground">Next step.</span> Re-run this prompt focusing on a single
              quantifiable outcome up front. Aim for &lt;5 fillers and steady eye contact across the full 90s.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Filler words", "9"],
              ["Pace (wpm)", "142"],
              ["Pauses", "4"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border bg-background/40 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{k}</p>
                <p className="mt-1 text-xl font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
