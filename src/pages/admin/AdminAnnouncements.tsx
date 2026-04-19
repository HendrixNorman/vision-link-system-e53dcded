import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Loader2, Megaphone, Trash2 } from "lucide-react";

type Target = "all" | "parents" | "teachers" | "students" | "user";

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<Target>("all");
  const [targetUserId, setTargetUserId] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
    ]);
    setItems(a ?? []);
    setUsers(p ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!title || !body) { toast.error("Title and body required"); return; }
    if (target === "user" && !targetUserId) { toast.error("Select target user"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("announcements").insert({
      title, body, target, target_user_id: target === "user" ? targetUserId : null, created_by: user?.id,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Announcement sent");
    setTitle(""); setBody(""); setTarget("all"); setTargetUserId("");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Announcements"
        description="Send messages to all users, a role group, or a specific user."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New announcement</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Send announcement</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div className="space-y-2"><Label>Message</Label><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Send to</Label>
                  <Select value={target} onValueChange={(v) => setTarget(v as Target)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="parents">Parents only</SelectItem>
                      <SelectItem value="teachers">Teachers only</SelectItem>
                      <SelectItem value="students">Students only</SelectItem>
                      <SelectItem value="user">Specific user</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {target === "user" && (
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Select value={targetUserId} onValueChange={setTargetUserId}>
                      <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                      <SelectContent>
                        {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Send</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="shadow-soft"><CardContent className="p-10 text-center text-muted-foreground">
          <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />No announcements yet.
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold">{a.title}</h3>
                    <Badge variant="secondary" className="capitalize">{a.target}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>
                  <div className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
