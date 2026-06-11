import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const generateDiagram = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ prompt: z.string().min(2).max(2000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const system = {
      role: "system" as const,
      content:
        "You generate Mermaid.js diagrams for engineering students. " +
        "Reply with ONLY a fenced ```mermaid code block — no prose, no explanations. " +
        "Pick the best diagram type for the request: flowchart TD, graph LR, mindmap, sequenceDiagram, classDiagram, erDiagram, stateDiagram-v2. " +
        "Keep node labels short. Use proper Mermaid syntax. Do NOT include markdown outside the code fence.",
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [system, { role: "user", content: data.prompt }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/```mermaid\s*([\s\S]*?)```/i);
    const code = (match ? match[1] : raw).trim();
    if (!code) throw new Error("AI did not return a diagram");
    return { code };
  });
