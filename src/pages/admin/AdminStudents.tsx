import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, GraduationCap, BookOpen, X } from "lucide-react";

interface Student { id: string; admission_no: string; full_name: string; class_name: string; }

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectsByStudent, setSubjectsByStudent] = useState<Record<string, string[]>>({});

  const [editing, setEditing] = useState<Student | null>(null);
  const [draftSubjects, setDraftSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: ss }] = await Promise.all([
      supabase.from("students").select("*").order("class_name").order("full_name"),
      supabase.from("student_subjects").select("student_id, subject"),
    ]);
    setStudents((s ?? []) as Student[]);
    const map: Record<string, string[]> = {};
    (ss ?? []).forEach((row: { student_id: string; subject: string }) => {
      (map[row.student_id] ||= []).push(row.subject);
    });
    setSubjectsByStudent(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEditor = (s: Student) => {
    setEditing(s);
    setDraftSubjects([...(subjectsByStudent[s.id] ?? [])]);
    setNewSubject("");
  };

  const addSubject = () => {
    const v = newSubject.trim();
    if (!v) return;
    if (draftSubjects.includes(v)) { toast.error("Subject already added"); return; }
    if (draftSubjects.length >= 9) { toast.error("Maximum 9 subjects"); return; }
    setDraftSubjects([...draftSubjects, v]);
    setNewSubject("");
  };

  const removeSubject = (subj: string) => {
    setDraftSubjects(draftSubjects.filter((x) => x !== subj));
  };

  const saveSubjects = async () => {
    if (!editing) return;
    if (draftSubjects.length !== 9) {
      toast.error(`Please assign exactly 9 subjects (currently ${draftSubjects.length}).`);
      return;
    }
    setSaving(true);
    const { error: delErr } = await supabase.from("student_subjects").delete().eq("student_id", editing.id);
    if (delErr) { toast.error(delErr.message); setSaving(false); return; }
    const rows = draftSubjects.map((subject) => ({ student_id: editing.id, subject }));
    const { error: insErr } = await supabase.from("student_subjects").insert(rows);
    setSaving(false);
    if (insErr) { toast.error(insErr.message); return; }
    toast.success("Subjects saved");
    setEditing(null);
    load();
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Students"
        description="All enrolled students. Assign each student exactly 9 subjects before uploading results."
      />
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
                    <th className="text-left p-4">Subjects</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const count = (subjectsByStudent[s.id] ?? []).length;
                    return (
                      <tr key={s.id} className="border-t border-border/60">
                        <td className="p-4 font-mono text-xs">{s.admission_no}</td>
                        <td className="p-4 font-medium">{s.full_name}</td>
                        <td className="p-4 text-muted-foreground">{s.class_name}</td>
                        <td className="p-4">
                          <Badge variant={count === 9 ? "default" : "secondary"}>{count} / 9</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button size="sm" variant="outline" onClick={() => openEditor(s)}>
                            <BookOpen className="h-4 w-4 mr-2" /> Subjects
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subjects for {editing?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Assign exactly 9 subjects. Results can only be submitted once these are set.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Mathematics"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubject(); } }}
              />
              <Button type="button" onClick={addSubject} disabled={draftSubjects.length >= 9}>Add</Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{draftSubjects.length} / 9 subjects</Label>
              {draftSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No subjects yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {draftSubjects.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1.5 pr-1.5 py-1">
                      {s}
                      <button type="button" onClick={() => removeSubject(s)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveSubjects} disabled={saving || draftSubjects.length !== 9}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save subjects
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
