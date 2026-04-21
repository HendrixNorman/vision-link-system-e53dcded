import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SchoolLogo } from "@/components/SchoolLogo";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Megaphone, FileText, Users, ArrowRight, Sparkles, GraduationCap } from "lucide-react";
import heroImg from "@/assets/hero-school.jpg";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const features = [
  { icon: FileText, title: "Online Results Access", desc: "Students and parents view term results securely, anytime." },
  { icon: Megaphone, title: "Instant Announcements", desc: "Reach the whole school, just parents, or specific users in one click." },
  { icon: ShieldCheck, title: "Private & Secure Portals", desc: "Strict role-based access. Parents see only their own children." },
  { icon: Users, title: "Unified User Management", desc: "Admins create teacher, student and parent accounts in seconds." },
];

export default function Landing() {
  const { settings } = useSiteSettings();
  const hero = settings?.hero_url || heroImg;
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="container mx-auto flex items-center justify-between py-4">
          <SchoolLogo />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href="#features">Features</a>
            </Button>
            <Button asChild size="sm">
              <Link to="/login">Login <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-cream pointer-events-none" />
        <div className="container mx-auto relative grid lg:grid-cols-2 gap-10 lg:gap-16 py-12 sm:py-20 lg:py-28 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Smart School Management
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight">
              The modern way to run <span className="text-primary">Double Vision</span> High School.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Secure portals for admins, teachers, students and parents. Publish results,
              send announcements, and manage your school — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-elegant">
                <Link to="/login">Sign in to your portal <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Bank-grade security</div>
              <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Built for schools</div>
            </div>
          </div>
          <div className="relative animate-fade-in-slow">
            <div className="absolute -inset-4 gradient-hero rounded-3xl opacity-20 blur-2xl" />
            <img
              src={hero}
              alt="Double Vision High School students in green and cream uniforms"
              width={1600}
              height={1024}
              className="relative rounded-2xl shadow-elegant w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold">Everything your school needs</h2>
            <p className="mt-3 text-muted-foreground">Designed for the realities of running a busy secondary school.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="border-border/60 shadow-soft hover:shadow-elegant transition-smooth">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-xl gradient-hero flex items-center justify-center mb-4 shadow-soft">
                    <f.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto">
          <div className="rounded-3xl gradient-hero p-8 sm:p-14 text-center shadow-elegant">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-primary-foreground">
              Ready to bring your school online?
            </h2>
            <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
              Sign in to your account or request a demo for your school today.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <SchoolLogo />
          <div>© {new Date().getFullYear()} Double Vision High School. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
