import { useEffect, useMemo, useState } from "react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Loader2, FileText, CheckCircle2, RotateCcw, Send, Trash2, Pencil, ChevronsUpDown, Lock } from "lucide-react";

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
  const isTeacher = roles.includes("teacher");

  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string; admission_no: string }[]>([]);
  const [myTeacherSubjects, setMyTeacherSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [term, setTerm] = useState("First Term");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [creating, setCreating] = useState(false);

  // editor
  const [editor, setEditor] = useState<Sheet | null>(null);
  const [editorSubjects, setEditorSubjects] = useState<string[]>([]);
  const [editorRows, setEditorRows] = useState<ScoreRow[]>([]);
  const [editorRemarks, setEditorRemarks] = useState("");
  const [savingEditor, setSavingEditor] = useState(false);

  const canEditSubject = (subject: string) => isAdmin || myTeacherSubjects.includes(subject);

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
    if (isTeacher && user?.id) {
      const { data: ts } = await supabase.from("teacher_subjects").select("subject").eq("teacher_user_id", user.id);
      setMyTeacherSubjects((ts ?? []).map((r) => r.subject));
    } else {
      setMyTeacherSubjects([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id, isTeacher]);

  const selectedStudent = useMemo(() => students.find((s) => s.id === studentId), [students, studentId]);

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
    const editableRows = editorRows.filter((r) => canEditSubject(r.subject) && r.score !== "");
    // validate only the rows the user can edit and has filled
    for (const r of editableRows) {
      const n = parseFloat(r.score);
      if (isNaN(n) || n < 0 || n > 100) {
        toast.error(`Invalid score for ${r.subject} (must be 0–100)`);
        return;
      }
    }
    if (alsoSubmit) {
      // before submission, every subject (including locked ones) must have a score
      const missing = editorRows.filter((r) => r.score === "" || isNaN(parseFloat(r.score)));
      if (missing.length > 0) {
        toast.error(`Cannot submit: missing scores for ${missing.map((m) => m.subject).join(", ")}. Ask the relevant teacher to fill them in.`);
        return;
      }
    }
    setSavingEditor(true);

    // upsert only the rows the user is allowed to edit
    for (const r of editableRows) {
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
              <Popover open={studentPickerOpen} onOpenChange={setStudentPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {selectedStudent ? `${selectedStudent.full_name} (${selectedStudent.admission_no})` : "Select student"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name or admission no..." />
                    <CommandList className="max-h-72">
                      <CommandEmpty>No students found.</CommandEmpty>
                      <CommandGroup>
                        {students.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={`${s.full_name} ${s.admission_no}`}
                            onSelect={() => { setStudentId(s.id); setStudentPickerOpen(false); }}
                          >
                            {s.full_name} <span className="ml-2 text-xs text-muted-foreground">({s.admission_no})</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
          {editorSubjects.length < 7 || editorSubjects.length > 9 ? (
            <p className="text-sm text-destructive">
              This student does not have between 7 and 9 subjects assigned. Fix it on the Students page first.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {isAdmin
                  ? `Enter a score (0–100) for each of the ${editorSubjects.length} subjects.`
                  : `You can enter scores for the subjects you teach. Other subjects are locked${myTeacherSubjects.length === 0 ? " — no subjects assigned to you yet, ask the admin" : ""}.`}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {editorRows.map((row, i) => {
                  const editable = canEditSubject(row.subject);
                  return (
                    <div key={row.subject} className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        {row.subject}
                        {!editable && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </Label>
                      <Input
                        type="number" min={0} max={100} value={row.score}
                        disabled={!editable}
                        title={editable ? undefined : "You don't teach this subject"}
                        onChange={(e) => {
                          const next = [...editorRows];
                          next[i] = { ...row, score: e.target.value };
                          setEditorRows(next);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Remarks (optional)</Label>
                <Textarea value={editorRemarks} onChange={(e) => setEditorRemarks(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor(null)}>Close</Button>
            <Button variant="secondary" onClick={() => saveScores(false)} disabled={savingEditor || editorSubjects.length < 7 || editorSubjects.length > 9}>
              {savingEditor && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save draft
            </Button>
            <Button onClick={() => saveScores(true)} disabled={savingEditor || editorSubjects.length < 7 || editorSubjects.length > 9}>
              <Send className="h-4 w-4 mr-2" /> Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
