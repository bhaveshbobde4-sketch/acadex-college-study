import { supabase } from "@/integrations/supabase/client";

export type Note = {
  id: string;
  title: string;
  subject: string;
  branch: string;
  semester: string;
  description: string | null;
  pdf_path: string;
  file_size_kb: number | null;
  downloads: number;
  is_hot: boolean;
  uploaded_by: string | null;
  created_at: string;
};

export type NoteFilters = {
  branch?: string;
  semester?: string;
  search?: string;
};

export async function fetchNotes(filters: NoteFilters = {}): Promise<Note[]> {
  let q = supabase.from("notes").select("*").order("downloads", { ascending: false });
  if (filters.branch) q = q.eq("branch", filters.branch);
  if (filters.semester) q = q.eq("semester", filters.semester);
  if (filters.search) q = q.or(`title.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
  const { data, error } = await q.limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function fetchTrendingNotes(limit = 6): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("downloads", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export function pdfPublicUrl(path: string): string {
  const { data } = supabase.storage.from("notes-pdfs").getPublicUrl(path);
  return data.publicUrl;
}

export async function logDownload(noteId: string, userId: string | null) {
  await supabase.from("note_downloads").insert({ note_id: noteId, user_id: userId });
}
