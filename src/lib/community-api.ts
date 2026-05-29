import { supabase } from "@/integrations/supabase/client";

export type PostTab = "Feed" | "Doubts" | "Internships" | "Confessions";

export type Post = {
  id: string;
  author_id: string;
  tab: PostTab;
  text: string;
  anonymous: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null } | null;
};

export async function fetchPosts(tab: PostTab | "All"): Promise<Post[]> {
  let q = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (tab !== "All") q = q.eq("tab", tab);
  const { data, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as Post[];
  const ids = Array.from(new Set(rows.filter((r) => !r.anonymous).map((r) => r.author_id)));
  if (!ids.length) return rows;
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids);
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, author: r.anonymous ? null : map.get(r.author_id) ?? null }));
}

export async function createPost(input: {
  text: string;
  tab: PostTab;
  anonymous?: boolean;
}) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Sign in to post");
  const { error } = await supabase.from("posts").insert({
    author_id: uid,
    text: input.text,
    tab: input.tab,
    anonymous: input.anonymous ?? input.tab === "Confessions",
  });
  if (error) throw error;
}

export async function toggleLike(postId: string, liked: boolean) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Sign in to like");
  if (liked) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", uid);
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: uid });
  }
}

export async function myLikedIds(): Promise<Set<string>> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return new Set();
  const { data } = await supabase.from("post_likes").select("post_id").eq("user_id", uid);
  return new Set((data ?? []).map((d) => d.post_id));
}
