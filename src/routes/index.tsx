import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Camera, BarChart3, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-primary)]">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">Interview Coach</span>
        </div>
        <div className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#" className="hover:text-foreground">Pricing</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Powered by real-time vision AI
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            AI Interview <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">Coach</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Practice mock interviews in your browser. Get instant feedback on confidence,
            eye contact, and clarity — like having a coach on call 24/7.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/interview"
              className="group inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
            >
              Start Interview
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#features" className="rounded-xl border border-border bg-card/50 px-6 py-3 text-sm font-semibold backdrop-blur hover:bg-card">
              Learn more
            </a>
          </div>
        </section>

        <section id="features" className="mt-28 grid gap-4 md:grid-cols-3">
          {[
            { icon: Camera, title: "Live webcam analysis", desc: "Real-time face & gaze detection while you speak." },
            { icon: Sparkles, title: "Emotion insights", desc: "Track confidence and tone throughout your answer." },
            { icon: BarChart3, title: "Coach-style report", desc: "Scored breakdown with actionable AI feedback." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-2xl border border-border bg-card/60 p-6 shadow-[var(--shadow-card)] backdrop-blur transition-colors hover:border-primary/40">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
