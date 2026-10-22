import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Plus, Send, Sparkles, Trash2, TriangleAlert, User } from "lucide-react";
import { useChat } from "../state/ChatContext";
import { useI18n } from "../lib/i18n";
import { Badge } from "../components/ui";
import Markdown from "../components/Markdown";

const FALLBACK_PROMPTS = [
  "Where did my money go this month?",
  "Am I overspending?",
  "How much should I save monthly?",
];

export default function Chat() {
  const { t, lang } = useI18n();
  const {
    status, messages, conversations, sending, error, notice,
    send, newChat, clearChat, openConversation, conversationId,
  } = useChat();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const suggestions = status?.suggestions?.[lang] ?? FALLBACK_PROMPTS;
  const welcome = status?.welcome?.[lang] ??
    (lang === "bm"
      ? "Hai! Saya MoneyTwin AI. Saya boleh bantu semak perbelanjaan, bajet dan simulasi kewangan."
      : "Hi! I'm MoneyTwin AI. I can help you understand your spending, budgets and what-if scenarios.");

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("navChat")}</p>
          <h1 className="display mt-1 text-[30px] leading-tight text-navy sm:text-[36px]">{t("aiAssistant")}</h1>
          <p className="mt-1 text-sm text-muted">
            {lang === "bm"
              ? "Menggunakan bajet dan transaksi anda sahaja. Sembang yang sama tersedia di setiap halaman."
              : "Uses only your own budgets and transactions. The same thread follows you across pages."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={status?.configured ? "jade" : "amber"}>
            {status?.configured ? `AI: ${status.provider}` : t("aiNotConnected")}
          </Badge>
          <button type="button" className="chip !py-1.5 text-xs" onClick={newChat}>
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            {lang === "bm" ? "Sembang baharu" : "New chat"}
          </button>
          <button type="button" className="chip !py-1.5 text-xs text-red-600" onClick={() => void clearChat()}>
            <Trash2 className="mr-1 inline h-3.5 w-3.5" />{t("clearChat")}
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="card p-3">
            <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              {lang === "bm" ? "Sejarah" : "History"}
            </p>
            {conversations.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted">{lang === "bm" ? "Belum ada sembang." : "No chats yet."}</p>
            ) : (
              <ul className="space-y-1">
                {conversations.map((conv) => (
                  <li key={conv.id}>
                    <button type="button" onClick={() => void openConversation(conv.id)}
                            className={`w-full truncate rounded-xl px-2.5 py-2 text-left text-sm ${
                              conversationId === conv.id ? "bg-canvas font-semibold text-navy" : "text-slate-600 hover:bg-slate-50"
                            }`}>
                      {conv.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-3 rounded-2xl border border-line bg-white p-3 text-xs text-muted">
            <p className="font-semibold text-navy">{lang === "bm" ? "Konteks data" : "Data context"}</p>
            <p className="mt-1">{lang === "bm" ? "Bulan semasa" : "Current month"}</p>
            <p className="mt-1">{lang === "bm" ? "Hanya rekod anda" : "Your records only"}</p>
          </div>
        </aside>

        <section className="card flex min-h-[62vh] flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            {messages.length === 0 && (
              <div className="flex gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo text-white">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="max-w-lg rounded-2xl rounded-tl-sm bg-canvas px-4 py-3 text-sm leading-relaxed text-slate-700">
                  {welcome}
                </div>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pl-11">
                {suggestions.map((prompt) => (
                  <button key={prompt} type="button" className="chip !text-xs" onClick={() => void send(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && (
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo text-white">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user" ? "rounded-tr-sm rounded-br-md bg-coral text-sm text-white" : "rounded-tl-sm rounded-bl-md bg-blue-soft text-sm text-navy"
                }`}>
                  {message.role === "assistant" ? <Markdown>{message.content}</Markdown> : message.content}
                  {message.role === "assistant" && message.status === "fallback" && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                      <TriangleAlert className="h-3 w-3" />{t("computedSummary")}
                    </p>
                  )}
                </div>
                {message.role === "user" && (
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    <User className="h-4 w-4" />
                  </span>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy text-accent">
                  <Bot className="h-4 w-4" />
                </span>
                <span className="inline-flex items-center gap-2 rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {lang === "bm" ? "Sedang menyemak data anda…" : "Checking your data…"}
                </span>
              </div>
            )}

            {notice && (
              <div className="ml-11 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">{t("aiNotConnected")}</p>
                <p className="mt-1 text-xs leading-relaxed">{notice.message}</p>
                {notice.hint && (
                  <p className="mt-2 rounded-lg bg-white/70 p-2 text-xs leading-relaxed text-slate-700">{notice.hint}</p>
                )}
              </div>
            )}

            {error && (
              <p role="alert" className="ml-11 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {error}
              </p>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(event) => { event.preventDefault(); void send(input); setInput(""); }}
                className="border-t border-line p-3 sm:p-4">
            <div className="flex items-end gap-2">
              <label htmlFor="chat-input" className="sr-only">{t("typeMessage")}</label>
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(input);
                    setInput("");
                  }
                }}
                placeholder={t("typeMessage")}
                className="input max-h-32 min-h-[46px] resize-none"
                maxLength={2000}
              />
              <button type="submit" className="btn-coral !px-4 !py-3" disabled={sending || !input.trim()}
                      aria-label={t("sendMessage")}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
              <Sparkles className="h-3 w-3" />
              {lang === "bm"
                ? "AI menerangkan; pelayan mengira. Tiada nasihat kewangan dijamin."
                : "The AI explains; the server calculates. No guaranteed financial advice."}
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
