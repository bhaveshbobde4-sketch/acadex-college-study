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
  if (filters.search)
    q = q.or(`title.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
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

export async function fetchNoteById(id: string): Promise<Note | null> {
  const { data, error } = await supabase.from("notes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export function pdfPublicUrl(path: string): string {
  const { data } = supabase.storage.from("notes-pdfs").getPublicUrl(path);
  return data.publicUrl;
}

export async function logDownload(noteId: string, userId: string | null) {
  await supabase.from("note_downloads").insert({ note_id: noteId, user_id: userId });
}

export async function uploadNotePdf(input: {
  file: File;
  title: string;
  subject: string;
  branch: string;
  semester: string;
  description?: string;
}) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Sign in to upload");

  const safe = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${uid}/${Date.now()}_${safe}`;
  const up = await supabase.storage.from("notes-pdfs").upload(path, input.file, {
    contentType: input.file.type || "application/pdf",
    upsert: false,
  });
  if (up.error) throw up.error;

  const { error } = await supabase.from("notes").insert({
    title: input.title,
    subject: input.subject,
    branch: input.branch,
    semester: input.semester,
    description: input.description ?? null,
    pdf_path: path,
    file_size_kb: Math.round(input.file.size / 1024),
    uploaded_by: uid,
  });
  if (error) throw error;
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
