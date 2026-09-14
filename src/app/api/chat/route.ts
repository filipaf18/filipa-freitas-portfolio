import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data";
import { SYSTEM_STABLE, buildUserContext } from "@/lib/chat-context";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";
const HISTORY_LIMIT = 60;
const MAX_MESSAGE_CHARS = 4000;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Não autenticada.", { status: 401 });

  let message: string;
  try {
    const body = (await req.json()) as { message?: unknown };
    message = typeof body.message === "string" ? body.message.trim() : "";
  } catch {
    return new Response("Pedido inválido.", { status: 400 });
  }
  if (!message) return new Response("Mensagem vazia.", { status: 400 });
  if (message.length > MAX_MESSAGE_CHARS) return new Response("Mensagem demasiado longa.", { status: 413 });
  if (!process.env.ANTHROPIC_API_KEY) return new Response("ANTHROPIC_API_KEY não configurada.", { status: 500 });

  const profile = await getOrCreateProfile(supabase, user.id, user.email);

  // Histórico (as N mensagens mais recentes, por ordem cronológica)
  const { data: historyDesc } = await supabase
    .from("chat_messages")
    .select("role, content")
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  const history = (historyDesc ?? []).reverse();

  const userContext = await buildUserContext(supabase, profile);

  // Guarda a mensagem da utilizadora antes de chamar o modelo.
  const { error: insertErr } = await supabase
    .from("chat_messages")
    .insert({ user_id: user.id, role: "user", content: message });
  if (insertErr) return new Response(insertErr.message, { status: 500 });

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: [
      { type: "text", text: SYSTEM_STABLE, cache_control: { type: "ephemeral" } },
      { type: "text", text: userContext },
    ],
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let assistantText = "";
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            assistantText += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();

        if (final.stop_reason === "refusal") {
          const note =
            "Não consigo responder a isso aqui. Se for uma questão de saúde, fala com o teu médico ou nutricionista.";
          assistantText = assistantText ? `${assistantText}\n\n${note}` : note;
          controller.enqueue(encoder.encode(`\n\n${note}`));
        }

        await supabase.from("chat_messages").insert({
          user_id: user.id,
          role: "assistant",
          content: assistantText,
          meta: {
            model: final.model,
            stop_reason: final.stop_reason,
            input_tokens: final.usage.input_tokens,
            output_tokens: final.usage.output_tokens,
            cache_read_input_tokens: final.usage.cache_read_input_tokens ?? 0,
          },
        });
      } catch (err) {
        const msg =
          err instanceof Anthropic.RateLimitError
            ? "O assistente está sobrecarregado. Tenta outra vez daqui a pouco."
            : err instanceof Anthropic.AuthenticationError
              ? "Chave da API Anthropic inválida."
              : err instanceof Anthropic.APIError
                ? `Erro do assistente (${err.status}).`
                : "Erro inesperado no assistente.";
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
        console.error("chat error", err);
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
