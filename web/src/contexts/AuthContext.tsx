import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { clearUserSession, getUserSession, type MobileUserSession } from "@/lib/auth";

type Profile = Tables<"profiles">;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  mobileSession: MobileUserSession | null;
  displayName: string;
  displayMobile: string;
  isMobileLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileSession, setMobileSession] = useState<MobileUserSession | null>(() => getUserSession());
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
  }, []);

  const checkAdmin = useCallback(async (userId: string) => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    setIsAdmin(data === true);
  }, []);

  useEffect(() => {
    const refreshMobileSession = () => setMobileSession(getUserSession());
    window.addEventListener("storage", refreshMobileSession);
    window.addEventListener("enjoyfreedeals-session-change", refreshMobileSession);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await Promise.all([
            fetchProfile(currentUser.id),
            checkAdmin(currentUser.id),
          ]);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        Promise.all([
          fetchProfile(currentUser.id),
          checkAdmin(currentUser.id),
        ]).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", refreshMobileSession);
      window.removeEventListener("enjoyfreedeals-session-change", refreshMobileSession);
    };
  }, [fetchProfile, checkAdmin]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    clearUserSession();
    setMobileSession(null);
    await supabase.auth.signOut();
  };

  const displayName = profile?.full_name || mobileSession?.full_name || user?.email || "";
  const displayMobile = mobileSession?.mobile || "";
  const isMobileLoggedIn = Boolean(mobileSession);

  return (
    <AuthContext.Provider value={{ user, profile, mobileSession, displayName, displayMobile, isMobileLoggedIn, isAdmin, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
