import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Loader2, FileText, Trash2 } from "lucide-react";

interface Result {
  id: string; student_id: string; subject: string; score: number; term: string; year: number; remarks: string | null;
  students?: { full_name: string; admission_no: string; class_name: string } | null;
}

export default function AdminResults() {
  const { user, roles } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string; admission_no: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [score, setScore] = useState("");
  const [term, setTerm] = useState("First Term");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [remarks, setRemarks] = useState("");

  const isAdmin = roles.includes("admin");

  const load = async () => {
    setLoading(true);
    const [{ data: rs }, { data: ss }] = await Promise.all([
      supabase.from("results").select("*, students(full_name, admission_no, class_name)").order("created_at", { ascending: false }).limit(200),
      supabase.from("students").select("id, full_name, admission_no").order("full_name"),
    ]);
    setResults((rs as Result[]) ?? []);
    setStudents(ss ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const sc = parseFloat(score);
    if (!studentId || !subject || isNaN(sc) || sc < 0 || sc > 100) { toast.error("Fill all fields with a valid score 0–100"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("results").insert({
      student_id: studentId, subject, score: sc, term, year: parseInt(year), remarks: remarks || null, created_by: user?.id,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Result added");
    setStudentId(""); setSubject(""); setScore(""); setRemarks("");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this result?")) return;
    const { error } = await supabase.from("results").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Results"
        description="Upload and manage student academic results."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add result</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New result entry</DialogTitle></DialogHeader>
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
                  <div className="space-y-2"><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Score (0–100)</Label><Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Select value={term} onValueChange={setTerm}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Term">First Term</SelectItem>
                        <SelectItem value="Second Term">Second Term</SelectItem>
                        <SelectItem value="Third Term">Third Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Year</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Remarks (optional)</Label><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : results.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />No results yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left p-4">Student</th>
                    <th className="text-left p-4">Subject</th>
                    <th className="text-left p-4">Score</th>
                    <th className="text-left p-4">Term</th>
                    <th className="text-left p-4">Year</th>
                    {isAdmin && <th className="p-4"></th>}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-t border-border/60">
                      <td className="p-4 font-medium">{r.students?.full_name ?? "—"}</td>
                      <td className="p-4">{r.subject}</td>
                      <td className="p-4 font-mono">{r.score}</td>
                      <td className="p-4 text-muted-foreground">{r.term}</td>
                      <td className="p-4 text-muted-foreground">{r.year}</td>
                      {isAdmin && (
                        <td className="p-4 text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      )}
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
