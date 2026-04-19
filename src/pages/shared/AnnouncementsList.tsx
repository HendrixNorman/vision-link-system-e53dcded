import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Megaphone } from "lucide-react";

export default function AnnouncementsList({ title = "Announcements" }: { title?: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader title={title} description="Messages from the school administration." />
      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="shadow-soft"><CardContent className="p-10 text-center text-muted-foreground">
          <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />No announcements.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="shadow-soft">
              <CardContent className="p-5 flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>
                  <div className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
