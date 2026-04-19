import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, TrendingUp, Megaphone } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("students").select("*").eq("user_id", user.id).maybeSingle();
      setStudent(s);
      if (s) {
        const { data: r } = await supabase.from("results").select("*").eq("student_id", s.id).order("created_at", { ascending: false });
        setResults(r ?? []);
      }
      const { data: a } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(5);
      setAnnouncements(a ?? []);
    })();
  }, [user]);

  const avg = results.length ? (results.reduce((s, r) => s + Number(r.score), 0) / results.length).toFixed(1) : "—";
  const subjects = new Set(results.map((r) => r.subject)).size;

  return (
    <DashboardLayout>
      <PageHeader
        title={student ? `Welcome, ${student.full_name.split(" ")[0]} 👋` : "Welcome"}
        description={student ? `${student.class_name} • Adm. ${student.admission_no}` : "Your student record will appear here once enrolled."}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Subjects graded" value={subjects} />
        <StatCard icon={TrendingUp} label="Average score" value={avg} hint={results.length ? `Across ${results.length} entries` : ""} />
        <StatCard icon={Megaphone} label="Announcements" value={announcements.length} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Recent results</h3>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No results published yet.</p>
            ) : (
              <ul className="space-y-2">
                {results.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div>
                      <div className="font-medium text-sm">{r.subject}</div>
                      <div className="text-xs text-muted-foreground">{r.term} {r.year}</div>
                    </div>
                    <div className="font-mono font-bold text-primary">{r.score}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Latest announcements</h3>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements.</p>
            ) : (
              <ul className="space-y-3">
                {announcements.map((a) => (
                  <li key={a.id} className="pb-3 border-b border-border/60 last:border-0">
                    <div className="font-medium text-sm">{a.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{a.body}</div>
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
