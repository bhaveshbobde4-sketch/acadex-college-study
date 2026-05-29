import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Heart, Share2, Briefcase, HelpCircle, EyeOff } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — Acadex" },
      { name: "description", content: "Discussions, doubt solving, notes sharing, anonymous confessions and internship chat." },
    ],
  }),
  component: CommunityPage,
});

const tabs = ["Feed", "Doubts", "Internships", "Confessions"] as const;
type Tab = typeof tabs[number];

const posts = [
  {
    tab: "Feed",
    author: "Priya · CSE'26",
    time: "2h",
    text: "Just finished my DSA prep with Acadex notes — cleared TCS NQT today! 🎉 Sharing my 30-day plan.",
    likes: 142, comments: 38,
  },
  {
    tab: "Doubts",
    author: "Rahul · ECE'25",
    time: "5h",
    text: "Can someone explain demand paging vs pre-paging with a real example? Exam in 2 days.",
    likes: 24, comments: 11,
    icon: HelpCircle,
  },
  {
    tab: "Internships",
    author: "Sneha · IT'25",
    time: "1d",
    text: "Razorpay SDE internship — round 2 was a system design lite. AMA below.",
    likes: 88, comments: 27,
    icon: Briefcase,
  },
  {
    tab: "Confessions",
    author: "Anonymous",
    time: "3h",
    text: "Backlog in DBMS but everyone thinks I'm a topper. The pressure is real.",
    likes: 312, comments: 64,
    icon: EyeOff,
  },
];

function CommunityPage() {
  const [tab, setTab] = useState<Tab>("Feed");
  const list = posts.filter((p) => tab === "Feed" || p.tab === tab);

  return (
    <PageShell title="Community" subtitle="Together">
      <div className="glass rounded-2xl p-1 flex">
        {tabs.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-xl px-2 py-2 text-xs font-medium transition-all ${
                active ? "btn-brand" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {list.map((p, i) => {
          const Icon = p.icon;
          return (
            <article key={i} className="glass rounded-3xl p-4 gradient-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-sky-500" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.author}</div>
                  <div className="text-[11px] text-muted-foreground">{p.time} ago · {p.tab}</div>
                </div>
                {Icon && <Icon className="h-4 w-4 text-[var(--brand-2)]" />}
              </div>
              <p className="mt-3 text-sm leading-relaxed">{p.text}</p>
              <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4" /> {p.likes}</span>
                <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {p.comments}</span>
                <span className="inline-flex items-center gap-1.5 ml-auto"><Share2 className="h-4 w-4" /> Share</span>
              </div>
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}
