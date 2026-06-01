import { supabase } from "@/integrations/supabase/client";

export type Branch = { id: string; name: string; sort_order: number };
export type Semester = { id: string; name: string; sort_order: number; branch: string | null };
export type Subject = {
  id: string;
  name: string;
  branch: string;
  semester: string;
  sort_order: number;
};

export const MATERIAL_TYPES = [
  { value: "notes", label: "Notes" },
  { value: "pyqs", label: "PYQs" },
  { value: "assignments", label: "Assignments" },
  { value: "syllabus", label: "Syllabus" },
  { value: "important_questions", label: "Important Questions" },
  { value: "lab_manuals", label: "Lab Manuals" },
] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number]["value"];

export function materialLabel(v: string | null | undefined): string {
  return MATERIAL_TYPES.find((m) => m.value === v)?.label ?? "Notes";
}

export async function fetchBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("id,name,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Branch[];
}

export async function fetchSemesters(branch?: string): Promise<Semester[]> {
  let q = supabase
    .from("semesters")
    .select("id,name,sort_order,branch")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (branch) q = q.or(`branch.is.null,branch.eq.${branch}`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Semester[];
}

export async function fetchSubjects(branch?: string, semester?: string): Promise<Subject[]> {
  let q = supabase
    .from("subjects")
    .select("id,name,branch,semester,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (branch) q = q.eq("branch", branch);
  if (semester) q = q.eq("semester", semester);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Subject[];
}
