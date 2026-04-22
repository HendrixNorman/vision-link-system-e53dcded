import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/dashboard/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FolderOpen, Upload, Loader2, Download, Trash2, Plus, FileText, Calendar } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  class_name: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
}

const MAX_FILE_MB = 25;

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Assignments() {
  const { user, roles } = useAuth();
  const role = primaryRole(roles);
  const isStaff = role === "admin" || role === "teacher";

  const [items, setItems] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState<string>("all");
  const [downloading, setDownloading] = useState<string | null>(null);

  // Upload dialog state
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classChoice, setClassChoice] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setItems((data ?? []) as Assignment[]);
    }

    if (isStaff) {
      const { data: cls } = await supabase
        .from("students")
        .select("class_name")
        .order("class_name");
      const unique = Array.from(new Set((cls ?? []).map((c: any) => c.class_name).filter(Boolean)));
      setClasses(unique);
    } else {
      const unique = Array.from(new Set((data ?? []).map((a: any) => a.class_name)));
      setClasses(unique);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(
    () => (filterClass === "all" ? items : items.filter((a) => a.class_name === filterClass)),
    [items, filterClass]
  );

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setClassChoice("");
    setDueDate("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Title is required");
    if (!classChoice) return toast.error("Pick a class");
    if (!file) return toast.error("Attach a document");
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return toast.error(`File must be under ${MAX_FILE_MB}MB`);
    }

    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
      const path = `${classChoice}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("assignments")
        .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("assignments").insert({
        title: title.trim(),
        description: description.trim() || null,
        class_name: classChoice,
        file_path: path,
        file_name: safeName,
        file_size: file.size,
        mime_type: file.type || null,
        due_date: dueDate || null,
        created_by: user.id,
      });
      if (insErr) {
        // Rollback the storage upload
        await supabase.storage.from("assignments").remove([path]);
        throw insErr;
      }

      toast.success("Assignment uploaded");
      resetForm();
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (a: Assignment) => {
    setDownloading(a.id);
    try {
      const { data, error } = await supabase.storage
        .from("assignments")
        .createSignedUrl(a.file_path, 60 * 5);
      if (error) throw error;
      // Open in new tab
      window.open(data.signedUrl, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e.message || "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (a: Assignment) => {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    try {
      await supabase.storage.from("assignments").remove([a.file_path]);
      const { error } = await supabase.from("assignments").delete().eq("id", a.id);
      if (error) throw error;
      toast.success("Deleted");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Assignments"
        description={
          isStaff
            ? "Share assignment documents (PDF, Word, etc.) with a specific class."
            : "Download assignment documents shared by your teachers."
        }
      />

      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-3 justify-between mb-5">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h3 className="font-display font-semibold text-lg">All assignments</h3>
              <Badge variant="secondary">{filtered.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {classes.length > 0 && (
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Filter class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {isStaff && (
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> New assignment
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No assignments {isStaff ? "uploaded yet." : "available for you yet."}
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-border/60 hover:border-primary transition-smooth"
                >
                  <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium truncate">{a.title}</span>
                      <Badge variant="outline">{a.class_name}</Badge>
                      {a.due_date && (
                        <Badge variant="secondary" className="gap-1">
                          <Calendar className="h-3 w-3" /> Due {new Date(a.due_date).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    {a.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</div>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {a.file_name} {a.file_size ? `• ${formatSize(a.file_size)}` : ""} • Uploaded {new Date(a.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(a)}
                      disabled={downloading === a.id}
                    >
                      {downloading === a.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download
                    </Button>
                    {isStaff && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(a)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Upload dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="a-title">Title</Label>
              <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Algebra exercise 3" maxLength={150} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-desc">Description (optional)</Label>
              <Textarea
                id="a-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions, what to submit, etc."
                rows={3}
                maxLength={1000}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Select value={classChoice} onValueChange={setClassChoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <SelectItem value="__none" disabled>No classes yet — add students first</SelectItem>
                    ) : (
                      classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-due">Due date (optional)</Label>
                <Input id="a-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-file">Document</Label>
              <Input
                id="a-file"
                ref={fileInput}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                PDF, Word, Excel, PowerPoint, images, or zip. Max {MAX_FILE_MB}MB.
              </p>
              {file && (
                <p className="text-xs text-muted-foreground">
                  Selected: {file.name} • {formatSize(file.size)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Upload</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
