import { supabase } from "@/integrations/supabase/client";

export type Video = {
  id: string;
  title: string;
  chapter: string | null;
  youtube_url: string;
  branch: string;
  semester: string;
  subject_id: string | null;
  sort_order: number;
  created_at: string;
};

export type VideoFilters = {
  branch?: string;
  semester?: string;
  subjectId?: string;
};

export async function fetchVideos(filters: VideoFilters = {}): Promise<Video[]> {
  let q = supabase
    .from("youtube_videos")
    .select("id,title,chapter,youtube_url,branch,semester,subject_id,sort_order,created_at")
    .order("chapter", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (filters.branch) q = q.eq("branch", filters.branch);
  if (filters.semester) q = q.eq("semester", filters.semester);
  if (filters.subjectId) q = q.eq("subject_id", filters.subjectId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Video[];
}

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/(embed|shorts)\/([^/?#]+)/);
    if (m) return m[2];
    return null;
  } catch {
    return null;
  }
}

export function youtubeThumb(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
