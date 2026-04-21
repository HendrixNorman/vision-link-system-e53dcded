import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, BookOpen } from "lucide-react";

interface Sheet {
  id: string; term: string; year: number; remarks: string | null;
  results: { id: string; subject: string; score: number }[];
}

export default function StudentResults() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle();
      if (s) {
        const { data } = await supabase
          .from("result_sheets")
          .select("id, term, year, remarks, results(id, subject, score)")
          .eq("student_id", s.id)
          .eq("status", "confirmed")
          .order("year", { ascending: false })
          .order("term");
        setSheets((data ?? []) as Sheet[]);
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardLayout>
      <PageHeader title="My results" description="Confirmed term results published by your school." />
      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : sheets.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-10 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />No confirmed results yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {sheets.map((sh) => {
            const total = sh.results.reduce((a, r) => a + Number(r.score), 0);
            const avg = sh.results.length ? (total / sh.results.length).toFixed(1) : "—";
            return (
              <Card key={sh.id} className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">{sh.term} {sh.year}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Total: <span className="font-mono font-bold text-foreground">{total}</span> · Avg:{" "}
                    <span className="font-mono font-bold text-foreground">{avg}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="text-left p-4">Subject</th>
                        <th className="text-left p-4">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sh.results.map((r) => (
                        <tr key={r.id} className="border-t border-border/60">
                          <td className="p-4 font-medium">{r.subject}</td>
                          <td className="p-4 font-mono font-bold text-primary">{r.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sh.remarks && (
                    <div className="p-4 border-t border-border/60 text-sm">
                      <span className="text-muted-foreground">Remarks: </span>{sh.remarks}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
