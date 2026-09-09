import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane, LogOut, BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/auth-context";

export default function Dashboard() {
  useEffect(() => {
    document.title = "Dashboard — Flight Price Notifier";

    // This route is behind auth and shouldn't be indexed — no server-side
    // per-route <head> anymore, so set it on mount instead.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const user = useAuthUser();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="glossy flex h-8 w-8 items-center justify-center rounded-lg bg-primary glow-primary">
              <Plane className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              Flight Price Notifier
            </span>
          </Link>
          <button
            onClick={handleSignOut}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            <LogOut className="h-4 w-4" />
            Sign out / 登出
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="animate-fade-up w-full max-w-lg text-center">
          <span className="glossy mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent glow-primary">
            <BellRing className="h-7 w-7 text-primary" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Hi {user.email}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            你的航線追蹤儀表板即將上線 —
            下一個里程碑會加上訂閱航線的功能。
          </p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Your dashboard is coming soon. Route-subscription will be added in
            the next milestone.
          </p>
        </div>
      </main>
    </div>
  );
}
