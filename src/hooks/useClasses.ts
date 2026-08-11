import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SchoolClass { id: string; name: string; level: string | null }

export function useClasses() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("classes").select("id, name, level").order("name");
      if (active) { setClasses((data ?? []) as SchoolClass[]); setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  return { classes, loading };
}

/** Minimal RFC-4180-ish CSV parser (handles quoted fields and embedded commas/newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ",") { row.push(field); field = ""; continue; }
    if (ch === "\r") continue;
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export interface CsvStudent { full_name: string; admission_no: string; class_name: string; email?: string }

const HEADER_ALIASES: Record<string, keyof CsvStudent> = {
  full_name: "full_name", fullname: "full_name", name: "full_name", "student name": "full_name",
  admission_no: "admission_no", admission: "admission_no", "admission no": "admission_no",
  admission_number: "admission_no", "admission number": "admission_no", adm: "admission_no",
  class_name: "class_name", class: "class_name", "class name": "class_name",
  email: "email", "email address": "email",
};

export function csvToStudents(text: string): { students: CsvStudent[]; error?: string } {
  const rows = parseCsv(text);
  if (rows.length < 2) return { students: [], error: "The file needs a header row and at least one student row." };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const map = header.map((h) => HEADER_ALIASES[h]);
  if (!map.includes("full_name") || !map.includes("admission_no") || !map.includes("class_name")) {
    return { students: [], error: "CSV must include columns: full_name, admission_no, class_name (email optional)." };
  }
  const students = rows.slice(1).map((r) => {
    const obj: CsvStudent = { full_name: "", admission_no: "", class_name: "" };
    map.forEach((key, idx) => { if (key) obj[key] = (r[idx] ?? "").trim(); });
    return obj;
  });
  return { students };
}
