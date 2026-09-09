import { Link } from "react-router-dom";
import { Plane, Radar, BellRing, CalendarX } from "lucide-react";

// Head/meta for this page lives statically in index.html — this is the
// site's default route, so its title/description/og tags already match.

const features = [
  {
    icon: Radar,
    title: "盯緊熱門航線",
    subtitle: "Always-on route watching",
    body: "持續監控台北出發的熱門航線（東京、首爾），自動抓最低票價。",
  },
  {
    icon: BellRing,
    title: "達標自動通知",
    subtitle: "Target-price email alerts",
    body: "低於你設定的目標價，就寄 email 提醒你，附上立即訂購連結。",
  },
  {
    icon: CalendarX,
    title: "隨時取消",
    subtitle: "Cancel anytime",
    body: "月訂閱制，不想用隨時停，沒有綁約。",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="glossy flex h-8 w-8 items-center justify-center rounded-lg bg-primary glow-primary">
              <Plane className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              Flight Price Notifier
            </span>
          </Link>
          <Link
            to="/auth"
            className="glossy inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in / 登入
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="gradient-balloon-bg pointer-events-none absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-[140px]"
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-24 text-center sm:px-6 sm:pt-32">
          <p
            className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground sm:text-sm"
            style={{ "--fade-delay": "0ms" } as React.CSSProperties}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary"
              style={{ animation: "pulse-soft 2.4s ease-in-out infinite" }}
            />
            台北出發 · 東京 / 首爾航線監控中
          </p>
          <h1
            className="animate-fade-up gradient-balloon-text text-4xl font-bold leading-tight tracking-tight sm:text-6xl"
            style={{ "--fade-delay": "120ms" } as React.CSSProperties}
          >
            Flight Price Notifier
          </h1>
          <p
            className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-2xl"
            style={{ "--fade-delay": "240ms" } as React.CSSProperties}
          >
            設定航線與目標價，機票降價就通知你
          </p>
          <p
            className="animate-fade-up mx-auto mt-3 max-w-xl text-sm text-muted-foreground/80 sm:text-base"
            style={{ "--fade-delay": "320ms" } as React.CSSProperties}
          >
            Set a route and a target price — we email you when the fare drops.
          </p>
          <div
            className="animate-fade-up mt-10 flex items-center justify-center"
            style={{ "--fade-delay": "420ms" } as React.CSSProperties}
          >
            <Link
              to="/auth"
              className="glossy inline-flex h-12 items-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 glow-primary"
            >
              Sign in / 登入
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((f, i) => (
              <article
                key={f.title}
                className="animate-fade-up rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                style={
                  { "--fade-delay": `${200 + i * 150}ms` } as React.CSSProperties
                }
              >
                <span className="glossy mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                  <f.icon className="h-5 w-5 text-primary" />
                </span>
                <h2 className="text-lg font-semibold">{f.title}</h2>
                <p className="mt-1 text-sm font-medium text-primary/90">
                  {f.subtitle}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 Flight Price Notifier
          </p>
        </div>
      </footer>
    </div>
  );
}
