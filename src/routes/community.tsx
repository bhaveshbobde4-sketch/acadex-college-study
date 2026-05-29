import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Heart, Share2, Briefcase, HelpCircle, EyeOff, Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { fetchPosts, createPost, toggleLike, myLikedIds, type PostTab } from "@/lib/community-api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — Acadex" },
      { name: "description", content: "Discussions, doubt solving, notes sharing, anonymous confessions and internship chat." },
    ],
  }),
  component: CommunityPage,
});

const tabs: ("Feed" | PostTab)[] = ["Feed", "Doubts", "Internships", "Confessions"];

function CommunityPage() {
  const [tab, setTab] = useState<PostTab>("Feed");
  const [compose, setCompose] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", tab],
    queryFn: () => fetchPosts(tab),
  });
  const { data: liked } = useQuery({
    queryKey: ["liked-ids", user?.id ?? "anon"],
    queryFn: myLikedIds,
    enabled: !!user,
  });

  const likeMut = useMutation({
    mutationFn: ({ id, isLiked }: { id: string; isLiked: boolean }) => toggleLike(id, isLiked),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["liked-ids"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageShell
      title="Community"
      subtitle="Together"
      right={
        user ? (
          <button onClick={() => setCompose(true)} aria-label="New post" className="btn-brand h-9 w-9 rounded-full flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </button>
        ) : (
          <Link to="/login" className="btn-brand rounded-full px-3 py-1.5 text-xs">Sign in</Link>
        )
      }
    >
      <div className="glass rounded-2xl p-1 flex">
        {tabs.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-xl px-2 py-2 text-xs font-medium transition-all ${active ? "btn-brand" : "text-muted-foreground"}`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !posts || posts.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center gradient-border">
            <div className="text-2xl mb-1">💬</div>
            <p className="text-sm font-semibold">No posts yet</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to start a conversation in {tab}.</p>
          </div>
        ) : (
          posts.map((p) => {
            const Icon = p.tab === "Doubts" ? HelpCircle : p.tab === "Internships" ? Briefcase : p.tab === "Confessions" ? EyeOff : null;
            const isLiked = liked?.has(p.id) ?? false;
            const name = p.anonymous ? "Anonymous" : p.author?.full_name ?? "Student";
            const time = timeAgo(p.created_at);
            return (
              <article key={p.id} className="glass rounded-3xl p-4 gradient-border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 overflow-hidden">
                    {!p.anonymous && p.author?.avatar_url && (
                      <img src={p.author.avatar_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{name}</div>
                    <div className="text-[11px] text-muted-foreground">{time} · {p.tab}</div>
                  </div>
                  {Icon && <Icon className="h-4 w-4 text-[var(--brand-2)]" />}
                </div>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{p.text}</p>
                <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
                  <button
                    onClick={() => user ? likeMut.mutate({ id: p.id, isLiked }) : toast.error("Sign in to like")}
                    className={`inline-flex items-center gap-1.5 transition-colors ${isLiked ? "text-[var(--brand-2)]" : ""}`}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} /> {p.likes_count}
                  </button>
                  <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {p.comments_count}</span>
                  <span className="inline-flex items-center gap-1.5 ml-auto"><Share2 className="h-4 w-4" /> Share</span>
                </div>
              </article>
            );
          })
        )}
      </div>

      {compose && <Composer initialTab={tab === "Feed" ? "Feed" : tab} onClose={() => setCompose(false)} />}
    </PageShell>
  );
}

function Composer({ initialTab, onClose }: { initialTab: PostTab; onClose: () => void }) {
  const [text, setText] = useState("");
  const [tab, setTab] = useState<PostTab>(initialTab);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => createPost({ text: text.trim(), tab, anonymous: tab === "Confessions" }),
    onSuccess: () => {
      toast.success("Posted");
      qc.invalidateQueries({ queryKey: ["posts"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-md rounded-3xl p-5 gradient-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">New post</h3>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-2 mb-3 overflow-x-auto -mx-1 px-1">
          {(["Feed", "Doubts", "Internships", "Confessions"] as PostTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs border ${tab === t ? "btn-brand border-transparent" : "bg-white/5 border-white/10 text-muted-foreground"}`}>{t}</button>
          ))}
        </div>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={tab === "Confessions" ? "Share anonymously…" : "What's on your mind?"}
          className="w-full glass rounded-2xl px-4 py-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {tab === "Confessions" && (
          <p className="text-[11px] text-muted-foreground mt-2">🔒 Posted anonymously — your name won't appear.</p>
        )}
        <button
          disabled={!text.trim() || mut.isPending}
          onClick={() => mut.mutate()}
          className="btn-brand mt-4 w-full rounded-2xl py-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Post
        </button>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
