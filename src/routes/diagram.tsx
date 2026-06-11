import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Copy, Download, ArrowLeft, Wand2 } from "lucide-react";
import { toast } from "sonner";
import mermaid from "mermaid";
import { PageShell } from "@/components/PageShell";
import { generateDiagram } from "@/lib/diagram.functions";

export const Route = createFileRoute("/diagram")({
  head: () => ({
    meta: [
      { title: "Diagram & Flowchart Generator — Acadex" },
      { name: "description", content: "AI-generated flowcharts, mind maps and architecture diagrams using Mermaid.js." },
    ],
  }),
  component: DiagramPage,
});

mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });

const EXAMPLES = [
  "Draw OS process scheduling flowchart",
  "Draw TCP/IP architecture diagram",
  "Draw binary search tree (data structure) diagram",
  "Draw DBMS ER diagram for student–course–enrollment",
  "Draw a mind map for OSI 7 layers",
];

function DiagramPage() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState<string>("");
  const [svg, setSvg] = useState<string>("");
  const previewRef = useRef<HTMLDivElement>(null);
  const gen = useServerFn(generateDiagram);

  const mut = useMutation({
    mutationFn: (p: string) => gen({ data: { prompt: p } }),
    onSuccess: (res) => setCode(res.code),
    onError: (e: Error) => toast.error(e.message || "Failed to generate"),
  });

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!code) { setSvg(""); return; }
      try {
        const { svg } = await mermaid.render("acadex-diagram-" + Date.now(), code);
        if (!cancelled) setSvg(svg);
      } catch (e) {
        if (!cancelled) {
          setSvg("");
          toast.error("Invalid diagram — try rephrasing");
          console.error(e);
        }
      }
    }
    render();
    return () => { cancelled = true; };
  }, [code]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || mut.isPending) return;
    setPrompt(t);
    mut.mutate(t);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    toast.success("Mermaid code copied");
  };

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "acadex-diagram.svg"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPng = async () => {
    if (!svg) return;
    const img = new Image();
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const w = img.width || 1200;
      const h = img.height || 800;
      const canvas = document.createElement("canvas");
      canvas.width = w * 2; canvas.height = h * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0b0814"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((b) => {
        if (!b) return;
        const u = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = u; a.download = "acadex-diagram.png"; a.click();
        URL.revokeObjectURL(u);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <PageShell
      title="Diagram Generator"
      subtitle="AI tool"
      right={
        <Link to="/ai" aria-label="Back" className="glass rounded-full h-9 w-9 flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      }
    >
      <div className="flex gap-2 -mx-4 px-4 overflow-x-auto pb-1">
        {EXAMPLES.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            className="shrink-0 glass rounded-2xl px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/[0.08]"
          >
            <Wand2 className="h-3.5 w-3.5 text-[var(--brand-2)]" /> {p}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(prompt); }}
        className="mt-4 glass-strong rounded-2xl p-2 flex items-center gap-2 gradient-border"
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a diagram… e.g. Draw DBMS ER diagram"
          className="flex-1 bg-transparent outline-none text-sm px-2 placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={mut.isPending}
          className="btn-brand h-10 w-10 rounded-xl flex items-center justify-center disabled:opacity-60"
          aria-label="Generate"
        >
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>

      {mut.isPending && (
        <div className="mt-6 glass rounded-3xl p-8 text-center text-muted-foreground flex items-center justify-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Drawing your diagram…
        </div>
      )}

      {svg && !mut.isPending && (
        <>
          <div className="mt-5 glass rounded-3xl p-4 gradient-border overflow-auto">
            <div
              ref={previewRef}
              className="mermaid-preview min-h-[200px] flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button onClick={copyCode} className="glass rounded-2xl py-2.5 text-xs flex items-center justify-center gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <button onClick={downloadSvg} className="glass rounded-2xl py-2.5 text-xs flex items-center justify-center gap-1.5">
              <Download className="h-3.5 w-3.5" /> SVG
            </button>
            <button onClick={exportPng} className="btn-brand rounded-2xl py-2.5 text-xs flex items-center justify-center gap-1.5">
              <Download className="h-3.5 w-3.5" /> PNG
            </button>
          </div>
          <details className="mt-3 glass rounded-2xl p-3 text-xs">
            <summary className="cursor-pointer text-muted-foreground">View Mermaid source</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-muted-foreground">{code}</pre>
          </details>
        </>
      )}

      {!svg && !mut.isPending && (
        <div className="mt-6 glass rounded-3xl p-8 text-center gradient-border">
          <div className="text-3xl mb-2">🧠</div>
          <p className="text-sm font-semibold">Generate any study diagram</p>
          <p className="text-xs text-muted-foreground mt-1">Flowcharts · Mind maps · ER · Architecture · Trees</p>
        </div>
      )}
    </PageShell>
  );
}
