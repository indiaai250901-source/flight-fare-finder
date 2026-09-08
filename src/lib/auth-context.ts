import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

// Provided by <RequireAuth> — holds the Supabase user for any route nested
// under it. Mirrors the old `Route.useRouteContext()` from
// `_authenticated/route.tsx`.
export const AuthUserContext = createContext<User | null>(null);

export function useAuthUser(): User {
  const user = useContext(AuthUserContext);
  if (!user) {
    throw new Error("useAuthUser must be used within <RequireAuth>");
  }
  return user;
}
