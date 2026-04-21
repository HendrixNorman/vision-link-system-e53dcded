import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Loader2, FileText, CheckCircle2, RotateCcw, Send, Trash2, Pencil } from "lucide-react";

type Status = "draft" | "submitted" | "confirmed";

interface Sheet {
  id: string;
  student_id: string;
  term: string;
  year: number;
  status: Status;
  remarks: string | null;
  students?: { full_name: string; admission_no: string; class_name: string } | null;
}

interface ScoreRow { id?: string; subject: string; score: string; }

const TERMS = ["First Term", "Second Term", "Third Term"];

export default function AdminResults() {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");

  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string; admission_no: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [term, setTerm] = useState("First Term");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [creating, setCreating] = useState(false);

  // editor
  const [editor, setEditor] = useState<Sheet | null>(null);
  const [editorSubjects, setEditorSubjects] = useState<string[]>([]);
  const [editorRows, setEditorRows] = useState<ScoreRow[]>([]);
  const [editorRemarks, setEditorRemarks] = useState("");
  const [savingEditor, setSavingEditor] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: rs }, { data: ss }] = await Promise.all([
      supabase
        .from("result_sheets")
        .select("*, students(full_name, admission_no, class_name)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("students").select("id, full_name, admission_no").order("full_name"),
    ]);
    setSheets((rs ?? []) as Sheet[]);
    setStudents(ss ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!studentId) { toast.error("Pick a student"); return; }
    setCreating(true);
    const { data: subs } = await supabase.from("student_subjects").select("subject").eq("student_id", studentId);
    const count = subs?.length ?? 0;
    if (count < 7 || count > 9) {
      setCreating(false);
      toast.error(`Student must have between 7 and 9 subjects assigned first (currently ${count}). Fix on the Students page.`);
      return;
    }
    const { error } = await supabase.from("result_sheets").insert({
      student_id: studentId, term, year: parseInt(year), created_by: user?.id, status: "draft",
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Result sheet created");
    setCreateOpen(false);
    setStudentId("");
    load();
  };

  const openEditor = async (sheet: Sheet) => {
    setEditor(sheet);
    setEditorRemarks(sheet.remarks ?? "");
    const [{ data: subs }, { data: existing }] = await Promise.all([
      supabase.from("student_subjects").select("subject").eq("student_id", sheet.student_id).order("subject"),
      supabase.from("results").select("id, subject, score").eq("sheet_id", sheet.id),
    ]);
    const subjectList = (subs ?? []).map((x) => x.subject);
    setEditorSubjects(subjectList);
    const map = new Map((existing ?? []).map((r) => [r.subject, r]));
    setEditorRows(
      subjectList.map((subj) => {
        const row = map.get(subj);
        return { id: row?.id, subject: subj, score: row ? String(row.score) : "" };
      })
    );
  };

  const saveScores = async (alsoSubmit: boolean) => {
    if (!editor) return;
    // validate
    for (const r of editorRows) {
      const n = parseFloat(r.score);
      if (isNaN(n) || n < 0 || n > 100) {
        toast.error(`Invalid score for ${r.subject} (must be 0–100)`);
        return;
      }
    }
    setSavingEditor(true);

    // upsert each score
    for (const r of editorRows) {
      const score = parseFloat(r.score);
      if (r.id) {
        const { error } = await supabase.from("results").update({ score }).eq("id", r.id);
        if (error) { toast.error(error.message); setSavingEditor(false); return; }
      } else {
        const { error } = await supabase.from("results").insert({
          sheet_id: editor.id, student_id: editor.student_id, subject: r.subject, score, created_by: user?.id,
        });
        if (error) { toast.error(error.message); setSavingEditor(false); return; }
      }
    }

    // remarks + optional submit
    const updates: { remarks: string | null; status?: Status } = { remarks: editorRemarks || null };
    if (alsoSubmit) updates.status = "submitted";
    const { error: upErr } = await supabase.from("result_sheets").update(updates).eq("id", editor.id);
    setSavingEditor(false);
    if (upErr) { toast.error(upErr.message); return; }
    toast.success(alsoSubmit ? "Submitted for confirmation" : "Saved");
    setEditor(null);
    load();
  };

  const confirmSheet = async (sheet: Sheet) => {
    const { error } = await supabase.from("result_sheets").update({ status: "confirmed" }).eq("id", sheet.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Confirmed — now visible to student & parents");
    load();
  };

  const reopenSheet = async (sheet: Sheet) => {
    if (!confirm("Reopen this confirmed sheet for editing? It will be hidden from student/parents until confirmed again.")) return;
    const { error } = await supabase.from("result_sheets").update({ status: "draft" }).eq("id", sheet.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Reopened as draft");
    load();
  };

  const deleteSheet = async (sheet: Sheet) => {
    if (!confirm("Delete this entire result sheet and all its scores?")) return;
    const { error } = await supabase.from("result_sheets").delete().eq("id", sheet.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  const statusBadge = (s: Status) => {
    const variants: Record<Status, "secondary" | "default" | "outline"> = {
      draft: "outline", submitted: "secondary", confirmed: "default",
    };
    return <Badge variant={variants[s]} className="capitalize">{s}</Badge>;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Results"
        description="One sheet per student per term — fill all 7–9 subject scores, submit, then admin confirms to publish."
        action={
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> New result sheet</Button>
        }
      />

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : sheets.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />No result sheets yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left p-4">Student</th>
                    <th className="text-left p-4">Class</th>
                    <th className="text-left p-4">Term</th>
                    <th className="text-left p-4">Year</th>
                    <th className="text-left p-4">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {sheets.map((s) => (
                    <tr key={s.id} className="border-t border-border/60">
                      <td className="p-4 font-medium">{s.students?.full_name ?? "—"}</td>
                      <td className="p-4 text-muted-foreground">{s.students?.class_name ?? "—"}</td>
                      <td className="p-4 text-muted-foreground">{s.term}</td>
                      <td className="p-4 text-muted-foreground">{s.year}</td>
                      <td className="p-4">{statusBadge(s.status)}</td>
                      <td className="p-4 text-right space-x-1">
                        {s.status !== "confirmed" && (
                          <Button size="sm" variant="ghost" onClick={() => openEditor(s)} title="Edit scores">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && s.status === "submitted" && (
                          <Button size="sm" variant="ghost" onClick={() => confirmSheet(s)} title="Confirm">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        {isAdmin && s.status === "confirmed" && (
                          <Button size="sm" variant="ghost" onClick={() => reopenSheet(s)} title="Reopen">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button size="sm" variant="ghost" onClick={() => deleteSheet(s)} title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create sheet dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New result sheet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editor dialog */}
      <Dialog open={!!editor} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editor?.students?.full_name} — {editor?.term} {editor?.year}
            </DialogTitle>
          </DialogHeader>
          {editorSubjects.length !== 9 ? (
            <p className="text-sm text-destructive">
              This student does not have exactly 9 subjects assigned. Fix it on the Students page first.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Enter a score (0–100) for each of the 9 subjects.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {editorRows.map((row, i) => (
                  <div key={row.subject} className="space-y-1">
                    <Label className="text-xs">{row.subject}</Label>
                    <Input
                      type="number" min={0} max={100} value={row.score}
                      onChange={(e) => {
                        const next = [...editorRows];
                        next[i] = { ...row, score: e.target.value };
                        setEditorRows(next);
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Remarks (optional)</Label>
                <Textarea value={editorRemarks} onChange={(e) => setEditorRemarks(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor(null)}>Close</Button>
            <Button variant="secondary" onClick={() => saveScores(false)} disabled={savingEditor || editorSubjects.length !== 9}>
              {savingEditor && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save draft
            </Button>
            <Button onClick={() => saveScores(true)} disabled={savingEditor || editorSubjects.length !== 9}>
              <Send className="h-4 w-4 mr-2" /> Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
