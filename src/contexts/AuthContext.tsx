import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "teacher" | "student" | "parent";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async (uid: string) => {
    try {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (!error) setRoles((data?.map((r) => r.role) ?? []) as AppRole[]);
    } catch {
      /* keep previous roles on transient failure */
    }
  };

  useEffect(() => {
    let active = true;
    let lastUid: string | null = null;

    // Single source of truth: INITIAL_SESSION fires on load, avoiding lock races with getSession.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) return;
      setSession(s);
      setUser(s?.user ?? null);
      const uid = s?.user?.id ?? null;
      if (!uid) {
        lastUid = null;
        setRoles([]);
        setLoading(false);
        return;
      }
      if (uid === lastUid) {
        setLoading(false);
        return;
      }
      lastUid = uid;
      // Defer DB call outside the auth callback to avoid auth lock deadlocks.
      setTimeout(() => {
        fetchRoles(uid).finally(() => active && setLoading(false));
      }, 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshRoles = async () => {
    if (user) await fetchRoles(user.id);
  };

  return (
    <Ctx.Provider value={{ session, user, roles, loading, signIn, signOut, refreshRoles }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function primaryRole(roles: AppRole[]): AppRole | null {
  const order: AppRole[] = ["admin", "teacher", "parent", "student"];
  return order.find((r) => roles.includes(r)) ?? null;
}

export function dashboardPathFor(role: AppRole | null): string {
  switch (role) {
    case "admin": return "/admin";
    case "teacher": return "/teacher";
    case "parent": return "/parent";
    case "student": return "/student";
    default: return "/login";
  }
}
