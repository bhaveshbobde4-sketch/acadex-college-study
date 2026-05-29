import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send, Loader2, Wand2, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { askTutor } from "@/lib/ai-tutor.functions";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Study Assistant — Acadex" },
      { name: "description", content: "Ask questions, summarize PDFs, generate revision notes and build study timetables with AI." },
    ],
  }),
  component: AIPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const quickPrompts = [
  { label: "Explain like I'm 5", icon: FileText, prompt: "Explain virtual memory like I'm 5." },
  { label: "Revision notes", icon: Wand2, prompt: "Generate concise revision notes for OSI model, 7 layers, one line each." },
  { label: "Make timetable", icon: Calendar, prompt: "Build a 7-day exam timetable for OS, DBMS, CN. I have 4 hours/day." },
];

function AIPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi 👋 I'm your Acadex tutor. Ask anything — concepts, doubts, or paste text to summarize." },
  ]);
  const [input, setInput] = useState("");
  const ask = useServerFn(askTutor);
  const endRef = useRef<HTMLDivElement>(null);

  const mut = useMutation({
    mutationFn: (next: Msg[]) => ask({ data: { messages: next } }),
    onSuccess: (res) => setMessages((m) => [...m, { role: "assistant", content: res.reply }]),
    onError: (e: Error) => toast.error(e.message || "AI failed"),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mut.isPending]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || mut.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    mut.mutate(next);
  };

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
        {quickPrompts.map(({ label, icon: Icon, prompt }) => (
          <button
            key={label}
            onClick={() => send(prompt)}
            className="shrink-0 glass rounded-2xl px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/[0.08]"
          >
            <Icon className="h-4 w-4 text-[var(--brand-2)]" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3 pb-32">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user" ? "btn-brand rounded-tr-md" : "glass rounded-tl-md"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {mut.isPending && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-tl-md px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="mx-auto max-w-md glass-strong rounded-2xl p-2 flex items-center gap-2 gradient-border"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything…"
            className="flex-1 bg-transparent outline-none text-sm px-2 placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={mut.isPending}
            className="btn-brand h-10 w-10 rounded-xl flex items-center justify-center disabled:opacity-60"
            aria-label="Send"
          >
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
