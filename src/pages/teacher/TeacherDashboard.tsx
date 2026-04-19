import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, FileText, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";

export default function TeacherDashboard() {
  const [stats, setStats] = useState({ students: 0, results: 0, announcements: 0 });

  useEffect(() => {
    (async () => {
      const [s, r, a] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("results").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
      ]);
      setStats({ students: s.count ?? 0, results: r.count ?? 0, announcements: a.count ?? 0 });
    })();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader title="Teacher dashboard" description="Manage student records and enter results." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={GraduationCap} label="Students" value={stats.students} />
        <StatCard icon={FileText} label="Results entries" value={stats.results} />
        <StatCard icon={Megaphone} label="Announcements" value={stats.announcements} />
      </div>

      <Card className="shadow-soft mt-6">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Quick actions</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link to="/teacher/students" className="rounded-lg border border-border/60 p-4 hover:border-primary hover:shadow-soft transition-smooth">
              <GraduationCap className="h-5 w-5 text-primary mb-2" />
              <div className="font-medium text-sm">View students</div>
            </Link>
            <Link to="/teacher/results" className="rounded-lg border border-border/60 p-4 hover:border-primary hover:shadow-soft transition-smooth">
              <FileText className="h-5 w-5 text-primary mb-2" />
              <div className="font-medium text-sm">Enter results</div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
