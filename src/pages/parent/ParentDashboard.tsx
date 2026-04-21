import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Baby, FileText, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [resultsCount, setResultsCount] = useState(0);
  const [announcementsCount, setAnnouncementsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: links } = await supabase.from("parent_students").select("student_id, students(*)").eq("parent_user_id", user.id);
      const kids = links?.map((l: any) => l.students) ?? [];
      setChildren(kids);

      if (kids.length) {
        const ids = kids.map((k: any) => k.id);
        const { count } = await supabase
          .from("result_sheets")
          .select("id", { count: "exact", head: true })
          .in("student_id", ids)
          .eq("status", "confirmed");
        setResultsCount(count ?? 0);
      }
      const { count: ac } = await supabase.from("announcements").select("id", { count: "exact", head: true });
      setAnnouncementsCount(ac ?? 0);
    })();
  }, [user]);

  return (
    <DashboardLayout>
      <PageHeader title="Parent dashboard" description="View your children's progress and school announcements." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Baby} label="My children" value={children.length} />
        <StatCard icon={FileText} label="Confirmed result sheets" value={resultsCount} />
        <StatCard icon={Megaphone} label="Announcements" value={announcementsCount} />
      </div>

      <Card className="shadow-soft mt-6">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold text-lg mb-4">My children</h3>
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">No children linked yet. Please contact the school administrator.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {children.map((c) => (
                <Link key={c.id} to="/parent/children" className="rounded-lg border border-border/60 p-4 hover:border-primary hover:shadow-soft transition-smooth">
                  <div className="font-medium">{c.full_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.class_name} • {c.admission_no}</div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
