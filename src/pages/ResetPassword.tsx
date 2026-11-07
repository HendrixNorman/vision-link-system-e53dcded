import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SchoolLogo } from "@/components/SchoolLogo";
import { supabase } from "@/integrations/supabase/client";

function hasRecoveryHash() {
  return new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type") === "recovery";
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [recoveryReady, setRecoveryReady] = useState(hasRecoveryHash);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    toast.success("Your password has been updated. Sign in with your new password.");
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <SchoolLogo />
      </div>

      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center py-10">
        <Card className="glass-panel w-full max-w-md border-0 rounded-[2rem]">
          <CardContent className="p-6 sm:p-8">
            {recoveryReady ? (
              <>
                <h1 className="text-2xl font-display font-bold">Choose a new password</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Enter your new password below to regain access to your account.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update password
                  </Button>
                </form>
              </>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <h1 className="text-2xl font-display font-bold">Reset link unavailable</h1>
                  <p className="text-sm leading-6 text-muted-foreground">
                    This reset link is invalid or has expired. Request a fresh link to continue.
                  </p>
                </div>
                <Button asChild variant="hero" size="lg" className="w-full">
                  <Link to="/forgot-password">Request a new link</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}