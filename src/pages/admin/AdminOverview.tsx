import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard, PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, GraduationCap, FileText, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, students: 0, results: 0, announcements: 0 });
  const [recent, setRecent] = useState<{ id: string; title: string; created_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [u, s, r, a, recentA] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("results").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id, title, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        users: u.count ?? 0,
        students: s.count ?? 0,
        results: r.count ?? 0,
        announcements: a.count ?? 0,
      });
      setRecent(recentA.data ?? []);
    })();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader title="Admin overview" description="Welcome back. Here's what's happening at Double Vision High School." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total users" value={stats.users} />
        <StatCard icon={GraduationCap} label="Students" value={stats.students} />
        <StatCard icon={FileText} label="Results entries" value={stats.results} />
        <StatCard icon={Megaphone} label="Announcements" value={stats.announcements} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Quick actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/users" className="rounded-lg border border-border/60 p-4 hover:border-primary hover:shadow-soft transition-smooth">
                <Users className="h-5 w-5 text-primary mb-2" />
                <div className="font-medium text-sm">Manage users</div>
              </Link>
              <Link to="/admin/students" className="rounded-lg border border-border/60 p-4 hover:border-primary hover:shadow-soft transition-smooth">
                <GraduationCap className="h-5 w-5 text-primary mb-2" />
                <div className="font-medium text-sm">View students</div>
              </Link>
              <Link to="/admin/results" className="rounded-lg border border-border/60 p-4 hover:border-primary hover:shadow-soft transition-smooth">
                <FileText className="h-5 w-5 text-primary mb-2" />
                <div className="font-medium text-sm">Upload results</div>
              </Link>
              <Link to="/admin/announcements" className="rounded-lg border border-border/60 p-4 hover:border-primary hover:shadow-soft transition-smooth">
                <Megaphone className="h-5 w-5 text-primary mb-2" />
                <div className="font-medium text-sm">Send announcement</div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Recent announcements</h3>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 pb-3 border-b border-border/60 last:border-0">
                    <Megaphone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{a.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
