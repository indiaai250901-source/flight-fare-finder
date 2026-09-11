import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane, LogOut, BellRing, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_FLIGHT_API_URL as string;

type PlanKey = "tokyo" | "seoul" | "london";

type PlanConfig = {
  label: string;
  origin: string;
  destination: string;
  route: string;
  hint: number;
};

const PLANS: Record<PlanKey, PlanConfig> = {
  tokyo: { label: "台北 ✈ 東京", origin: "TPE", destination: "TYO", route: "TPE-TYO", hint: 9325 },
  seoul: { label: "台北 ✈ 首爾", origin: "TPE", destination: "SEL", route: "TPE-SEL", hint: 5989 },
  london: { label: "台北 ✈ 倫敦", origin: "TPE", destination: "LON", route: "TPE-LON", hint: 20216 },
};

type Subscription = {
  route: string;
  plan_name: string;
  target_price: number;
  subscription_status?: string;
  current_period_end_date?: string;
};

// M2: a row's visible state for the card. Legacy M1 rows (no
// subscription_status at all) and rows explicitly "pending_payment" are
// treated the same — both need the user to pay before they're actually
// served notifications (see m2-ecpay-subscription Step 7 migration note).
type CardStatus = "none" | "pending_payment" | "active" | "cancelled" | "expired";

function cardStatusOf(sub: Subscription | undefined): CardStatus {
  if (!sub) return "none";
  const s = sub.subscription_status;
  if (s === "active" || s === "cancelled" || s === "expired") return s;
  return "pending_payment";
}

function statusBadge(status: CardStatus) {
  switch (status) {
    case "active":
      return <Badge>已訂閱（有效）</Badge>;
    case "pending_payment":
      return <Badge variant="secondary">未完成付款</Badge>;
    case "cancelled":
      return <Badge variant="outline">已取消</Badge>;
    case "expired":
      return <Badge variant="destructive">已結束</Badge>;
    default:
      return null;
  }
}

function buttonLabel(status: CardStatus): string {
  switch (status) {
    case "none":
      return "開始追蹤";
    case "pending_payment":
      return "完成付款";
    case "expired":
      return "重新訂閱";
    default:
      return "更新目標價";
  }
}

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

  const [subscriptions, setSubscriptions] = useState<Record<string, Subscription>>({});
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [targets, setTargets] = useState<Record<PlanKey, string>>({
    tokyo: String(PLANS.tokyo.hint),
    seoul: String(PLANS.seoul.hint),
    london: String(PLANS.london.hint),
  });
  const [submitting, setSubmitting] = useState<PlanKey | null>(null);
  const [cancelling, setCancelling] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_URL || !user.email) {
      setLoadingSubs(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/subscriptions?email=${encodeURIComponent(user.email!)}`,
        );
        if (!res.ok) throw new Error("failed to load subscriptions");
        const data = await res.json();
        if (cancelled) return;
        const byRoute: Record<string, Subscription> = {};
        const nextTargets: Partial<Record<PlanKey, string>> = {};
        for (const item of data.items ?? []) {
          byRoute[item.route] = item;
          const planKey = (Object.keys(PLANS) as PlanKey[]).find(
            (k) => PLANS[k].route === item.route,
          );
          if (planKey) nextTargets[planKey] = String(item.target_price);
        }
        setSubscriptions(byRoute);
        if (Object.keys(nextTargets).length > 0) {
          setTargets((t) => ({ ...t, ...nextTargets }));
        }
      } catch {
        // best-effort — leave cards in the unsubscribed state
      } finally {
        if (!cancelled) setLoadingSubs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  async function handleSubscribe(planKey: PlanKey) {
    const plan = PLANS[planKey];
    const targetPrice = Number(targets[planKey]);
    if (!targetPrice || targetPrice <= 0) {
      setError("請輸入有效的目標價格");
      return;
    }
    if (!API_URL) {
      setError("API 尚未設定，請稍後再試");
      return;
    }
    setError(null);
    setSubmitting(planKey);
    try {
      const res = await fetch(`${API_URL}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          plan_name: planKey,
          target_price: targetPrice,
        }),
      });
      if (!res.ok) throw new Error("subscribe failed");

      // M2: /subscribe returns either an ECPay auto-submit checkout form
      // (text/html — payment needed) or a plain status update
      // (application/json — already active/cancelled-in-grace, no
      // re-payment). res.json() on the HTML branch would silently throw,
      // which is exactly the M1 bug that made the button do nothing.
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        const html = await res.text();
        document.open();
        document.write(html);
        document.close();
        return; // the page is navigating to ECPay's cashier now
      }

      const data = await res.json();
      setSubscriptions((s) => ({
        ...s,
        [plan.route]: {
          ...(s[plan.route] ?? { route: plan.route, plan_name: planKey, target_price: targetPrice }),
          target_price: targetPrice,
          subscription_status: data.subscription_status ?? s[plan.route]?.subscription_status,
        },
      }));
    } catch {
      setError("訂閱失敗，請稍後再試");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCancel(planKey: PlanKey) {
    const plan = PLANS[planKey];
    if (!API_URL || !user.email) return;
    if (!window.confirm(`確定要取消「${plan.label}」的訂閱嗎？本期效期內仍會收到通知，之後才會真正停止。`)) {
      return;
    }
    setError(null);
    setCancelling(planKey);
    try {
      const res = await fetch(`${API_URL}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, route: plan.route }),
      });
      if (!res.ok) throw new Error("cancel failed");
      const data = await res.json();
      setSubscriptions((s) => ({
        ...s,
        [plan.route]: {
          ...(s[plan.route] ?? {
            route: plan.route,
            plan_name: planKey,
            target_price: Number(targets[planKey]),
          }),
          subscription_status: "cancelled",
          current_period_end_date:
            data.current_period_end_date ?? String(data.current_period_end ?? "").slice(0, 10),
        },
      }));
    } catch {
      setError("取消訂閱失敗，請稍後再試");
    } finally {
      setCancelling(null);
    }
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <div className="animate-fade-up mb-10 text-center">
          <span className="glossy mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent glow-primary">
            <BellRing className="h-7 w-7 text-primary" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hi {user.email}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            選一條航線、設定你的目標價，達標時我們會寄信通知你。
          </p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Pick a route and a target price — we'll email you when the fare drops to it.
          </p>
        </div>

        {error && <p className="mb-6 text-center text-sm text-destructive">{error}</p>}

        <div className="grid gap-6 sm:grid-cols-2">
          {(Object.keys(PLANS) as PlanKey[]).map((planKey) => {
            const plan = PLANS[planKey];
            const sub = subscriptions[plan.route];
            const status = cardStatusOf(sub);
            return (
              <Card key={planKey} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.label}</CardTitle>
                    {statusBadge(status)}
                  </div>
                  <CardDescription>目前最低約 NT${plan.hint.toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    目標價格（TWD）
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={targets[planKey]}
                    onChange={(e) =>
                      setTargets((t) => ({ ...t, [planKey]: e.target.value }))
                    }
                    disabled={loadingSubs}
                  />
                  {sub && (
                    <p className="text-xs text-muted-foreground">
                      目前追蹤目標：NT${Number(sub.target_price).toLocaleString()}
                    </p>
                  )}
                  {status === "pending_payment" && (
                    <p className="text-xs text-muted-foreground">
                      尚未完成付款，通知會在付款成功後開始發送。
                    </p>
                  )}
                  {status === "cancelled" && (
                    <p className="text-xs text-muted-foreground">
                      已取消續訂
                      {sub?.current_period_end_date ? `，有效至 ${sub.current_period_end_date}` : ""}
                      （期間內仍會通知）。
                    </p>
                  )}
                  {status === "expired" && (
                    <p className="text-xs text-muted-foreground">
                      訂閱已結束，重新訂閱即可恢復通知。
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(planKey)}
                    disabled={submitting === planKey || cancelling === planKey || loadingSubs}
                  >
                    {submitting === planKey ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      buttonLabel(status)
                    )}
                  </Button>
                  {status === "active" && (
                    <button
                      type="button"
                      onClick={() => handleCancel(planKey)}
                      disabled={cancelling === planKey || submitting === planKey}
                      className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline disabled:opacity-50"
                    >
                      {cancelling === planKey ? "取消中…" : "取消訂閱"}
                    </button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
