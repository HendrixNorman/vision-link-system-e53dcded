import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Users as UsersIcon } from "lucide-react";

type Role = "admin" | "teacher" | "student" | "parent";

interface Row {
  id: string;
  email: string;
  full_name: string;
  role: Role | null;
}

interface StudentLite { id: string; full_name: string; admission_no: string; }

const COMMON_SUBJECTS = [
  "Mathematics", "English Language", "Kiswahili", "Biology", "Chemistry", "Physics",
  "History", "Geography", "Business Studies", "Agriculture", "Computer Studies",
  "CRE", "IRE", "Hindu Religious Education", "French", "German", "Music", "Art & Design",
  "Home Science", "Physical Education",
];

export default function AdminUsers() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | Role>("all");

  // form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [admissionNo, setAdmissionNo] = useState("");
  const [className, setClassName] = useState("");
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [subjectPool, setSubjectPool] = useState<string[]>(COMMON_SUBJECTS);
  const [newSubject, setNewSubject] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: rolesData }, { data: studentsData }, { data: existingSubjects }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("students").select("id, full_name, admission_no").order("full_name"),
      supabase.from("student_subjects").select("subject"),
    ]);
    const roleMap = new Map<string, Role>();
    rolesData?.forEach((r) => roleMap.set(r.user_id, r.role as Role));
    setRows((profiles ?? []).map((p) => ({ ...p, role: roleMap.get(p.id) ?? null })));
    setStudents(studentsData ?? []);
    const merged = Array.from(new Set([...COMMON_SUBJECTS, ...((existingSubjects ?? []).map((s) => s.subject))])).sort();
    setSubjectPool(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEmail(""); setPassword(""); setFullName(""); setRole("student");
    setAdmissionNo(""); setClassName(""); setSelectedChildren([]);
    setTeacherSubjects([]); setNewSubject("");
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$";
    let p = "";
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setPassword(p);
  };

  const handleCreate = async () => {
    if (!email || !password || !fullName) { toast.error("Email, password and name required"); return; }
    if (role === "student" && (!admissionNo || !className)) { toast.error("Admission no. and class required"); return; }
    if (role === "teacher" && teacherSubjects.length === 0) { toast.error("Pick at least one subject this teacher teaches"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        email, password, full_name: fullName, role,
        admission_no: role === "student" ? admissionNo : undefined,
        class_name: role === "student" ? className : undefined,
        child_student_ids: role === "parent" ? selectedChildren : undefined,
        teacher_subjects: role === "teacher" ? teacherSubjects : undefined,
      },
    });
    setSubmitting(false);
    if (error || data?.error) {
      toast.error(error?.message ?? data?.error ?? "Failed to create user");
      return;
    }
    toast.success(`User created. Login: ${email} / ${password}`);
    resetForm();
    setOpen(false);
    load();
  };

  const handleDelete = async (uid: string) => {
    if (uid === user?.id) { toast.error("You cannot delete yourself"); return; }
    if (!confirm("Delete this user permanently? This also removes their role and any linked records.")) return;
    const { data, error } = await supabase.functions.invoke("admin-delete-user", { body: { user_id: uid } });
    if (error || data?.error) { toast.error(error?.message ?? data?.error); return; }
    toast.success("User deleted");
    load();
  };

  const filtered = filter === "all" ? rows : rows.filter((r) => r.role === filter);

  return (
    <DashboardLayout>
      <PageHeader
        title="Users"
        description="Create and manage admin, teacher, student and parent accounts."
        action={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New user</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create new user</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="flex gap-2">
                    <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
                    <Button type="button" variant="outline" onClick={generatePassword}>Generate</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {role === "student" && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Admission no.</Label><Input value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Class</Label><Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. JSS 2A" /></div>
                  </div>
                )}
                {role === "parent" && (
                  <div className="space-y-2">
                    <Label>Link to children</Label>
                    {students.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Create student accounts first.</p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                        {students.map((s) => (
                          <label key={s.id} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent">
                            <input
                              type="checkbox"
                              checked={selectedChildren.includes(s.id)}
                              onChange={(e) => setSelectedChildren((prev) => e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id))}
                            />
                            <span className="text-sm">{s.full_name} <span className="text-muted-foreground">({s.admission_no})</span></span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {role === "teacher" && (
                  <div className="space-y-2">
                    <Label>Subjects this teacher teaches</Label>
                    <p className="text-xs text-muted-foreground">They will only be able to enter or edit marks for these subjects.</p>
                    <div className="max-h-44 overflow-y-auto border rounded-md divide-y">
                      {subjectPool.map((subj) => (
                        <label key={subj} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent">
                          <input
                            type="checkbox"
                            checked={teacherSubjects.includes(subj)}
                            onChange={(e) => setTeacherSubjects((prev) => e.target.checked ? [...prev, subj] : prev.filter((x) => x !== subj))}
                          />
                          <span className="text-sm">{subj}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a custom subject"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const v = newSubject.trim();
                            if (!v) return;
                            if (!subjectPool.includes(v)) setSubjectPool((p) => [...p, v].sort());
                            if (!teacherSubjects.includes(v)) setTeacherSubjects((p) => [...p, v]);
                            setNewSubject("");
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={() => {
                        const v = newSubject.trim();
                        if (!v) return;
                        if (!subjectPool.includes(v)) setSubjectPool((p) => [...p, v].sort());
                        if (!teacherSubjects.includes(v)) setTeacherSubjects((p) => [...p, v]);
                        setNewSubject("");
                      }}>Add</Button>
                    </div>
                    {teacherSubjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {teacherSubjects.map((s) => (
                          <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => setTeacherSubjects((p) => p.filter((x) => x !== s))}>
                            {s} ✕
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create user
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "admin", "teacher", "student", "parent"] as const).map((r) => (
          <Button key={r} size="sm" variant={filter === r ? "default" : "outline"} onClick={() => setFilter(r)} className="capitalize">
            {r}
          </Button>
        ))}
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <UsersIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No users yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-border/60">
                      <td className="p-4 font-medium">{r.full_name}</td>
                      <td className="p-4 text-muted-foreground">{r.email}</td>
                      <td className="p-4"><Badge variant="secondary" className="capitalize">{r.role ?? "—"}</Badge></td>
                      <td className="p-4 text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)} disabled={r.id === user?.id}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
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
