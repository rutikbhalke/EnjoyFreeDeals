import { Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ADMIN_SECRET_STORAGE_KEY = "enjoyfreedeals_admin_secret";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const [secret, setSecret] = useState("");
  const [hasAdminSecret, setHasAdminSecret] = useState(() =>
    Boolean(localStorage.getItem(ADMIN_SECRET_STORAGE_KEY))
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (hasAdminSecret) return <>{children}</>;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
          <h1 className="font-display text-2xl font-bold">Admin Access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the backend admin secret to open the admin panel.
          </p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = secret.trim();
              if (!trimmed) return;
              localStorage.setItem(ADMIN_SECRET_STORAGE_KEY, trimmed);
              setHasAdminSecret(true);
            }}
          >
            <Input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="Admin secret"
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full">Open Admin Panel</Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <a className="font-medium text-primary hover:underline" href="/auth">Sign in with admin account</a>
          </div>
        </div>
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
