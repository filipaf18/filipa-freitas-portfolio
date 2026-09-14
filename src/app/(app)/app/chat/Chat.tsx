"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ChatRole } from "@/lib/database.types";
import { clearChat } from "./actions";

type Msg = { id: string; role: ChatRole; content: string; pending?: boolean };

const SUGGESTIONS = [
  "Hoje tive náuseas. Ajusta as refeições de amanhã.",
  "Não gosto de peixe cozido, sugere outra coisa com a mesma proteína.",
  "Que lanches ricos em proteína posso ter em casa?",
  "Estou com pouca fome esta semana. O que devo priorizar?",
];

export function Chat({ initial, displayName }: { initial: Msg[]; displayName: string }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [clearing, startClear] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    setInput("");
    setStreaming(true);

    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now()}`;
    setMessages((m) => [
      ...m,
      { id: userId, role: "user", content },
      { id: assistantId, role: "assistant", content: "", pending: true },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.text();
        setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: `⚠️ ${err || res.statusText}`, pending: false } : x)));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: snapshot } : x)));
      }
      setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, pending: false } : x)));
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: "⚠️ Falha de ligação.", pending: false } : x)));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col gap-4">
      <div className="card flex flex-1 flex-col gap-3 overflow-y-auto" style={{ maxHeight: "65vh" }}>
        {messages.length === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Olá {displayName}! Tenho acesso ao teu perfil, medicação, análises, hidratação e plano. Diz-me o que queres ajustar.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="btn-secondary text-left text-xs">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                m.role === "user" ? "bg-accent text-white" : "bg-accent-soft"
              }`}
            >
              {m.content || (m.pending ? <span className="animate-pulse">a pensar…</span> : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex flex-col gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={2}
          placeholder="Escreve aqui… (Enter envia, Shift+Enter nova linha)"
          className="input resize-none"
          disabled={streaming}
        />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={streaming || clearing || messages.length === 0}
            onClick={() => {
              if (confirm("Apagar toda a conversa? O assistente deixa de se lembrar dos ajustes anteriores.")) {
                startClear(async () => {
                  await clearChat();
                  setMessages([]);
                });
              }
            }}
            className="text-xs text-muted hover:text-red-600 disabled:opacity-40"
          >
            Limpar conversa
          </button>
          <div className="flex gap-2">
            {streaming && (
              <button type="button" onClick={() => abortRef.current?.abort()} className="btn-secondary">
                Parar
              </button>
            )}
            <button type="submit" disabled={streaming || !input.trim()} className="btn-primary">
              Enviar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
