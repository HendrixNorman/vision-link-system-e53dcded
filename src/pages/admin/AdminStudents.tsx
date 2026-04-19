import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GraduationCap } from "lucide-react";

export default function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("students").select("*").order("class_name").order("full_name");
      setStudents(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader title="Students" description="All enrolled students. Create new ones via the Users page." />
      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No students enrolled yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left p-4">Admission #</th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Class</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t border-border/60">
                      <td className="p-4 font-mono text-xs">{s.admission_no}</td>
                      <td className="p-4 font-medium">{s.full_name}</td>
                      <td className="p-4 text-muted-foreground">{s.class_name}</td>
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
