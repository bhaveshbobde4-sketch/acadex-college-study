import { supabase } from "@/integrations/supabase/client";

export type Note = {
  id: string;
  title: string;
  subject: string;
  branch: string;
  semester: string;
  description: string | null;
  pdf_path: string | null;
  pdf_url: string | null;
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
  if (filters.search)
    q = q.or(`title.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
  const { data, error } = await q.limit(100);
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function fetchTrendingNotes(limit = 6): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("downloads", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function fetchNoteById(id: string): Promise<Note | null> {
  const { data, error } = await supabase.from("notes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Note | null;
}

/** Returns a usable URL — prefers the admin-supplied pdf_url, falls back to the legacy storage bucket. */
export function noteDisplayUrl(note: Pick<Note, "pdf_url" | "pdf_path">): string {
  if (note.pdf_url) return note.pdf_url;
  if (note.pdf_path) {
    const { data } = supabase.storage.from("notes-pdfs").getPublicUrl(note.pdf_path);
    return data.publicUrl;
  }
  return "";
}

export async function logDownload(noteId: string, userId: string | null) {
  await supabase.from("note_downloads").insert({ note_id: noteId, user_id: userId });
}

export async function fetchMySavedIds(): Promise<Set<string>> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return new Set();
  const { data } = await supabase.from("saved_notes").select("note_id").eq("user_id", uid);
  return new Set((data ?? []).map((d) => d.note_id));
}

export async function toggleSave(noteId: string, saved: boolean) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Sign in to save");
  if (saved) {
    await supabase.from("saved_notes").delete().eq("user_id", uid).eq("note_id", noteId);
  } else {
    await supabase.from("saved_notes").insert({ user_id: uid, note_id: noteId });
  }
}
