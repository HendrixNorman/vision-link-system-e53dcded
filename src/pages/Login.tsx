import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, primaryRole, dashboardPathFor } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SchoolLogo } from "@/components/SchoolLogo";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function Login() {
  const { signIn, user, roles, loading } = useAuth();
  const { schoolName } = useSiteSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate(dashboardPathFor(primaryRole(roles)), { replace: true });
    }
  }, [loading, user, roles, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Welcome back!");
  };

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-background overflow-hidden">
      {/* Left brand panel */}
      <div className="hidden lg:flex relative overflow-hidden gradient-hero p-12 flex-col justify-between">
        <SchoolLogo className="text-primary-foreground [&_*]:text-primary-foreground" />
        <div className="relative text-primary-foreground">
          <h2 className="text-4xl font-display font-bold leading-tight">
            Welcome back to {schoolName}
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Sign in to access your portal — results, announcements and more, all in one secure place.
          </p>
        </div>
        <div className="text-primary-foreground/60 text-sm">
          © {new Date().getFullYear()} {schoolName}
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="lg:hidden"><SchoolLogo /></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md glass-panel border-0 rounded-[2rem]">
            <CardContent className="p-6 sm:p-8">
              <h1 className="text-2xl font-display font-bold">Sign in</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your school account credentials.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@doublevision.school" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
                </Button>
              </form>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
