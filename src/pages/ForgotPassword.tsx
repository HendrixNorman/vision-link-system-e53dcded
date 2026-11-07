import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SchoolLogo } from "@/components/SchoolLogo";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
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
            {sent ? (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <MailCheck className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-display font-bold">Check your email</h1>
                  <p className="text-sm leading-6 text-muted-foreground">
                    If an account uses that email, a password reset link will arrive shortly.
                  </p>
                </div>
                <Button asChild variant="hero" size="lg" className="w-full">
                  <Link to="/login">Return to sign in</Link>
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-display font-bold">Reset your password</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Enter the email address on your school account and we’ll send you a reset link.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email">Email</Label>
                    <Input
                      id="recovery-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send reset link
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}