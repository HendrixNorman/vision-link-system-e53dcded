import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Baby } from "lucide-react";

export default function ParentChildren() {
  const { user } = useAuth();
  const [data, setData] = useState<{ student: any; results: any[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: links } = await supabase.from("parent_students").select("students(*)").eq("parent_user_id", user.id);
      const kids = (links ?? []).map((l: any) => l.students).filter(Boolean);
      const enriched = await Promise.all(kids.map(async (s: any) => {
        const { data: sheets } = await supabase
          .from("result_sheets")
          .select("term, year, remarks, results(id, subject, score)")
          .eq("student_id", s.id)
          .eq("status", "confirmed")
          .order("year", { ascending: false })
          .order("term");
        const flat: any[] = [];
        (sheets ?? []).forEach((sh: any) => {
          (sh.results ?? []).forEach((r: any) =>
            flat.push({ ...r, term: sh.term, year: sh.year, remarks: sh.remarks })
          );
        });
        return { student: s, results: flat };
      }));
      setData(enriched);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <DashboardLayout><div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="My children" description="Academic progress for each of your children." />
      {data.length === 0 ? (
        <Card className="shadow-soft"><CardContent className="p-10 text-center text-muted-foreground">
          <Baby className="h-10 w-10 mx-auto mb-3 opacity-40" />No children linked to your account.
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {data.map(({ student, results }) => {
            const avg = results.length ? (results.reduce((s, r) => s + Number(r.score), 0) / results.length).toFixed(1) : "—";
            return (
              <Card key={student.id} className="shadow-soft">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-display font-bold text-xl">{student.full_name}</h3>
                      <div className="text-sm text-muted-foreground">{student.class_name} • Admission {student.admission_no}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Average</div>
                      <div className="text-2xl font-display font-bold text-primary">{avg}</div>
                    </div>
                  </div>
                  {results.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No results published yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="text-left p-3">Subject</th>
                            <th className="text-left p-3">Score</th>
                            <th className="text-left p-3">Term</th>
                            <th className="text-left p-3">Year</th>
                            <th className="text-left p-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r) => (
                            <tr key={r.id} className="border-t border-border/60">
                              <td className="p-3 font-medium">{r.subject}</td>
                              <td className="p-3 font-mono font-bold text-primary">{r.score}</td>
                              <td className="p-3 text-muted-foreground">{r.term}</td>
                              <td className="p-3 text-muted-foreground">{r.year}</td>
                              <td className="p-3 text-muted-foreground">{r.remarks ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
