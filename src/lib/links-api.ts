import { supabase } from "@/integrations/supabase/client";

export type ImportantLink = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  branch: string;
  semester: string;
  subject_id: string | null;
  sort_order: number;
  created_at: string;
};

export type LinkFilters = {
  branch?: string;
  semester?: string;
  subjectId?: string;
};

export async function fetchLinks(filters: LinkFilters = {}): Promise<ImportantLink[]> {
  let q = supabase
    .from("important_links")
    .select("id,title,url,description,branch,semester,subject_id,sort_order,created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (filters.branch) q = q.eq("branch", filters.branch);
  if (filters.semester) q = q.eq("semester", filters.semester);
  if (filters.subjectId) q = q.eq("subject_id", filters.subjectId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ImportantLink[];
}
