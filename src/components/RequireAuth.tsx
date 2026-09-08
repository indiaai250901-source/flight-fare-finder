import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { AuthUserContext } from "@/lib/auth-context";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" };

// Client-side auth guard, replacing the old `_authenticated/route.tsx`
// `beforeLoad` redirect (that ran on the server during SSR; here it runs in
// the browser after mount, same as every other Supabase auth check in this app).
export default function RequireAuth({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data.user) {
        setState({ status: "unauthenticated" });
      } else {
        setState({ status: "authenticated", user: data.user });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.status === "unauthenticated") {
    return <Navigate to="/auth" replace />;
  }

  return <AuthUserContext.Provider value={state.user}>{children}</AuthUserContext.Provider>;
}
