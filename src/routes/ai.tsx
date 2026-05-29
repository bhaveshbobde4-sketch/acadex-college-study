import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Send, FileUp, Calendar, Wand2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Study Assistant — Acadex" },
      { name: "description", content: "Ask questions, summarize PDFs, generate revision notes and build study timetables with AI." },
    ],
  }),
  component: AIPage,
});

const seedMessages = [
  { from: "ai", text: "Hi Aarav 👋 I'm your Acadex tutor. Ask me anything — concepts, doubts, or upload a PDF to summarize." },
  { from: "user", text: "Explain virtual memory like I'm 5." },
  { from: "ai", text: "Imagine your desk (RAM) is small. Virtual memory lets you keep extra books on a shelf (disk) and swap them onto the desk only when you need them. To you it feels like one huge desk." },
];

const tools = [
  { label: "Summarize PDF", icon: FileUp },
  { label: "Revision notes", icon: Wand2 },
  { label: "Make timetable", icon: Calendar },
];

function AIPage() {
  const [messages] = useState(seedMessages);
  const [input, setInput] = useState("");

  return (
    <PageShell
      title="AI Tutor"
      subtitle="Assistant"
      right={
        <span className="glass rounded-full px-3 py-1 text-[10px] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-[var(--brand-2)]" /> Premium
        </span>
      }
    >
      <div className="flex gap-2 -mx-4 px-4 overflow-x-auto pb-1">
        {tools.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="shrink-0 glass rounded-2xl px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/[0.08]"
          >
            <Icon className="h-4 w-4 text-[var(--brand-2)]" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3 pb-32">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.from === "user"
                  ? "btn-brand rounded-tr-md"
                  : "glass rounded-tl-md"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4">
        <div className="mx-auto max-w-md glass-strong rounded-2xl p-2 flex items-center gap-2 gradient-border">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything…"
            className="flex-1 bg-transparent outline-none text-sm px-2 placeholder:text-muted-foreground"
          />
          <button className="btn-brand h-10 w-10 rounded-xl flex items-center justify-center" aria-label="Send">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </PageShell>
  );
}
