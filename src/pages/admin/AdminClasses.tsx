import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, School, Pencil } from "lucide-react";

interface ClassRow { id: string; name: string; level: string | null }

export default function AdminClasses() {
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: cls }, { data: studs }] = await Promise.all([
      supabase.from("classes").select("id, name, level").order("name"),
      supabase.from("students").select("class_name"),
    ]);
    setRows((cls ?? []) as ClassRow[]);
    const c: Record<string, number> = {};
    (studs ?? []).forEach((s: { class_name: string }) => { c[s.class_name] = (c[s.class_name] ?? 0) + 1; });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setName(""); setLevel(""); setOpen(true); };
  const openEdit = (r: ClassRow) => { setEditing(r); setName(r.name); setLevel(r.level ?? ""); setOpen(true); };

  const save = async () => {
    const n = name.trim();
    if (!n) { toast.error("Class name is required"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("classes").update({ name: n, level: level.trim() || null }).eq("id", editing.id);
      if (!error && n !== editing.name) {
        await supabase.from("students").update({ class_name: n }).eq("class_name", editing.name);
        await supabase.from("assignments").update({ class_name: n }).eq("class_name", editing.name);
      }
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Class updated");
    } else {
      const { error } = await supabase.from("classes").insert({ name: n, level: level.trim() || null });
      setSaving(false);
      if (error) { toast.error(error.message.includes("duplicate") ? "That class already exists" : error.message); return; }
      toast.success("Class created");
    }
    setOpen(false);
    load();
  };

  const remove = async (r: ClassRow) => {
    if ((counts[r.name] ?? 0) > 0) {
      toast.error("Move or remove the students in this class first");
      return;
    }
    if (!confirm(`Delete class "${r.name}"?`)) return;
    const { error } = await supabase.from("classes").delete().eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Class deleted");
    load();
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Classes"
        description="Create the classes for your school first — students are then enrolled into these classes."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> New class</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit class" : "New class"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Class name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Form 1A" />
                </div>
                <div className="space-y-2">
                  <Label>Level (optional)</Label>
                  <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. Form 1" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <School className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No classes yet. Create your first class to start enrolling students.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{r.name}</div>
                    {r.level && <div className="text-xs text-muted-foreground">{r.level}</div>}
                  </div>
                  <Badge variant="secondary">{counts[r.name] ?? 0} students</Badge>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
