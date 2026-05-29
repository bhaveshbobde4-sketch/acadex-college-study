import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

export const askTutor = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ messages: z.array(MessageSchema).min(1).max(20) }).parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const systemMsg = {
      role: "system" as const,
      content:
        "You are Acadex AI Tutor for Indian engineering/college students. Be concise, structured (use bullets when helpful), warm, and exam-focused. Use simple analogies. If a question is ambiguous, ask one clarifying question.",
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [systemMsg, ...data.messages],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content ?? "Sorry, I couldn't answer that.";
    return { reply };
  });
