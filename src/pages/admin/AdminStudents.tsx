import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClasses, csvToStudents, type CsvStudent } from "@/hooks/useClasses";
import { toast } from "sonner";
import { Loader2, GraduationCap, BookOpen, X, Plus, Upload, Download, Search } from "lucide-react";

interface Student { id: string; admission_no: string; full_name: string; class_name: string; }

interface ImportResult {
  admission_no: string; full_name: string; email: string; password: string;
  status: "created" | "failed"; error?: string;
}

export default function AdminStudents() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const { classes } = useClasses();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectsByStudent, setSubjectsByStudent] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const [editing, setEditing] = useState<Student | null>(null);
  const [draftSubjects, setDraftSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [saving, setSaving] = useState(false);

  // manual add
  const [addOpen, setAddOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);

  // csv import
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvRows, setCsvRows] = useState<CsvStudent[]>([]);
  const [csvOpen, setCsvOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);

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
    if (draftSubjects.length < 7 || draftSubjects.length > 9) {
      toast.error(`Please assign between 7 and 9 subjects (currently ${draftSubjects.length}).`);
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

  const runImport = async (rows: CsvStudent[]) => {
    const { data, error } = await supabase.functions.invoke("admin-import-students", {
      body: { students: rows },
    });
    if (error || data?.error) {
      toast.error(error?.message ?? data?.error ?? "Import failed");
      return null;
    }
    return data as { created: number; failed: number; results: ImportResult[] };
  };

  const createOne = async () => {
    if (!fullName.trim() || !admissionNo.trim() || !className) {
      toast.error("Name, admission number and class are required");
      return;
    }
    setCreating(true);
    const res = await runImport([{
      full_name: fullName.trim(), admission_no: admissionNo.trim(),
      class_name: className, email: email.trim() || undefined,
    }]);
    setCreating(false);
    if (!res) return;
    const r = res.results[0];
    if (r.status === "failed") { toast.error(r.error ?? "Could not create student"); return; }
    toast.success(`Student added. Login: ${r.email} / ${r.password}`);
    setAddOpen(false);
    setFullName(""); setAdmissionNo(""); setClassName(""); setEmail("");
    load();
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    const { students: parsed, error } = csvToStudents(text);
    if (error) { toast.error(error); return; }
    setCsvRows(parsed);
    setResults(null);
    setCsvOpen(true);
  };

  const confirmImport = async () => {
    setImporting(true);
    const res = await runImport(csvRows);
    setImporting(false);
    if (!res) return;
    setResults(res.results);
    toast.success(`${res.created} student(s) imported${res.failed ? `, ${res.failed} failed` : ""}`);
    load();
  };

  const downloadTemplate = () => {
    const csv = "full_name,admission_no,class_name,email\nJane Doe,ADM001," + (classes[0]?.name ?? "Form 1A") + ",\n";
    downloadCsv(csv, "students-template.csv");
  };

  const downloadCredentials = () => {
    if (!results) return;
    const lines = ["full_name,admission_no,email,password,status,error"];
    results.forEach((r) => {
      lines.push([r.full_name, r.admission_no, r.email, r.password, r.status, r.error ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    });
    downloadCsv(lines.join("\n"), "student-logins.csv");
  };

  const downloadCsv = (content: string, filename: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = students.filter((s) => {
    const matchesClass = classFilter === "all" || s.class_name === classFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || s.full_name.toLowerCase().includes(q) || s.admission_no.toLowerCase().includes(q);
    return matchesClass && matchesSearch;
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Students"
        description="Enrol students one by one or import a CSV. Each student needs between 7 and 9 subjects before results can be submitted."
        action={isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" /> CSV template
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Import CSV
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add student
            </Button>
            <input
              ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
            />
          </div>
        ) : undefined}
      />

      {isAdmin && classes.length === 0 && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-sm">
            You have no classes yet. Create classes under <strong>Classes</strong> first — students can only be enrolled into an existing class.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or admission number" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-40" />
              {students.length === 0 ? "No students enrolled yet." : "No students match your filters."}
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
                  {filtered.map((s) => {
                    const count = (subjectsByStudent[s.id] ?? []).length;
                    return (
                      <tr key={s.id} className="border-t border-border/60">
                        <td className="p-4 font-mono text-xs">{s.admission_no}</td>
                        <td className="p-4 font-medium">{s.full_name}</td>
                        <td className="p-4 text-muted-foreground">{s.class_name}</td>
                        <td className="p-4">
                          <Badge variant={count >= 7 && count <= 9 ? "default" : "secondary"}>{count} / 7–9</Badge>
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

      {/* Manual add */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add student</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Admission no.</Label><Input value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={className} onValueChange={setClassName}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Auto-generated from admission no. if blank" />
            </div>
            <p className="text-xs text-muted-foreground">
              The login password is automatically the student's first name, then <strong>@</strong>, then their admission number.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={createOne} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV import */}
      <Dialog open={csvOpen} onOpenChange={(o) => { setCsvOpen(o); if (!o) { setCsvRows([]); setResults(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{results ? "Import results" : `Import ${csvRows.length} student(s)`}</DialogTitle></DialogHeader>
          {!results ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Each student gets a login account. Password = first name @ admission number (e.g. <strong>Jane@ADM001</strong>).
                Classes must already exist.
              </p>
              <div className="border rounded-md overflow-x-auto max-h-72">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr><th className="text-left p-2">Name</th><th className="text-left p-2">Adm #</th><th className="text-left p-2">Class</th><th className="text-left p-2">Email</th></tr>
                  </thead>
                  <tbody>
                    {csvRows.map((r, i) => (
                      <tr key={i} className="border-t border-border/60">
                        <td className="p-2">{r.full_name}</td>
                        <td className="p-2 font-mono text-xs">{r.admission_no}</td>
                        <td className="p-2">
                          {r.class_name}
                          {!classes.some((c) => c.name === r.class_name) && (
                            <Badge variant="destructive" className="ml-2">unknown</Badge>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground text-xs">{r.email || "auto"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border rounded-md overflow-x-auto max-h-72">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr><th className="text-left p-2">Name</th><th className="text-left p-2">Email</th><th className="text-left p-2">Password</th><th className="text-left p-2">Status</th></tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-t border-border/60">
                        <td className="p-2">{r.full_name}</td>
                        <td className="p-2 text-xs">{r.email}</td>
                        <td className="p-2 font-mono text-xs">{r.status === "created" ? r.password : "—"}</td>
                        <td className="p-2">
                          {r.status === "created"
                            ? <Badge>created</Badge>
                            : <span className="text-xs text-destructive">{r.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="outline" onClick={downloadCredentials}>
                <Download className="h-4 w-4 mr-2" /> Download logins CSV
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvOpen(false)}>{results ? "Close" : "Cancel"}</Button>
            {!results && (
              <Button onClick={confirmImport} disabled={importing || csvRows.length === 0}>
                {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Import students
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subjects for {editing?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Assign between 7 and 9 subjects. Results can only be submitted once these are set.
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
              <Label className="text-xs text-muted-foreground">{draftSubjects.length} / 7–9 subjects</Label>
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
            <Button onClick={saveSubjects} disabled={saving || draftSubjects.length < 7 || draftSubjects.length > 9}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save subjects
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
