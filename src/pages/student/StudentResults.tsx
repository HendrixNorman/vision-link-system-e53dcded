import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, BookOpen } from "lucide-react";

export default function StudentResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
      if (s) {
        const { data: r } = await supabase.from("results").select("*").eq("student_id", s.id).order("year", { ascending: false }).order("term");
        setResults(r ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardLayout>
      <PageHeader title="My results" description="All your academic results in one place." />
      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : results.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />No results published yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left p-4">Subject</th>
                    <th className="text-left p-4">Score</th>
                    <th className="text-left p-4">Term</th>
                    <th className="text-left p-4">Year</th>
                    <th className="text-left p-4">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-t border-border/60">
                      <td className="p-4 font-medium">{r.subject}</td>
                      <td className="p-4 font-mono font-bold text-primary">{r.score}</td>
                      <td className="p-4 text-muted-foreground">{r.term}</td>
                      <td className="p-4 text-muted-foreground">{r.year}</td>
                      <td className="p-4 text-muted-foreground">{r.remarks ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
