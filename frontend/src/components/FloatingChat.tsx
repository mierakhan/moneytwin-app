import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Maximize2, MessageSquare, Plus, Send, TriangleAlert, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useChat } from "../state/ChatContext";
import { useI18n } from "../lib/i18n";
import Markdown from "./Markdown";

const PROMPTS = {
  en: [
    "Where did my money go this month?",
    "Am I overspending?",
    "Can I afford RM300 extra per month?",
    "How can I reach my savings goal faster?",
    "Compare my spending with last month.",
  ],
  bm: [
    "Ke mana wang saya pergi bulan ini?",
    "Adakah saya terlebih belanja?",
    "Mampu ke tambah RM300 sebulan?",
    "Macam mana capai sasaran simpanan lebih cepat?",
    "Bandingkan belanja saya dengan bulan lepas.",
  ],
};

function clock(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}

export default function FloatingChat() {
  const { lang } = useI18n();
  const { status, messages, sending, error, notice, send, newChat, clearChat } = useChat();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const onChatPage = location.pathname.startsWith("/app/chat");

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const suggestions = status?.suggestions?.[lang] ?? PROMPTS[lang];
  const configured = Boolean(status?.configured);
  const verified = Boolean(status?.verified_for_user);
  const connected = configured && verified;

  if (onChatPage) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={lang === "bm" ? "Buka pembantu MoneyTwin" : "Open the MoneyTwin assistant"}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-coral text-white shadow-[0_14px_30px_-12px_rgba(242,92,102,0.85)] transition hover:scale-105 md:bottom-6 md:right-6 md:h-16 md:w-16"
        >
          <MessageSquare className="h-6 w-6" />
          {configured && (
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-jade" />
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:inset-auto sm:bottom-6 sm:right-6">
          <div className="absolute inset-0 bg-navy/30 sm:hidden" onClick={() => setOpen(false)} />
          <section
            role="dialog"
            aria-label="MoneyTwin AI Assistant"
            className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[600px] sm:w-[400px] sm:rounded-3xl sm:border sm:border-line"
          >
            <header className="flex items-center gap-3 bg-ink px-4 py-3.5 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral/20">
                <Bot className="h-5 w-5 text-coral" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">MoneyTwin AI</p>
                <p className="flex items-center gap-1.5 text-[11px] text-white/70">
                  <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-jade" : configured ? "bg-white/60" : "bg-accent"}`} />
                  {connected
                    ? (lang === "bm" ? "Bersambung" : "Connected")
                    : configured
                      ? (lang === "bm" ? "Sedia, belum diuji" : "Ready, not yet used")
                      : (lang === "bm" ? "AI belum disambung" : "AI not connected")}
                </p>
              </div>
              <Link
                to="/app/chat"
                onClick={() => setOpen(false)}
                aria-label={lang === "bm" ? "Buka skrin penuh" : "Open full page"}
                className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={lang === "bm" ? "Tutup" : "Close"}
                className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-canvas/60 p-3.5">
              {messages.length === 0 && (
                <div className="rounded-2xl rounded-tl-sm bg-white p-3.5 text-sm leading-relaxed text-slate-700 shadow-sm">
                  {status?.welcome?.[lang] ??
                    (lang === "bm"
                      ? "Hai! Saya MoneyTwin AI. Tanya tentang perbelanjaan, bajet atau sasaran simpanan anda."
                      : "Hi! I'm MoneyTwin AI. Ask about your spending, budgets or savings goals.")}
                </div>
              )}
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.slice(0, 4).map((prompt) => (
                    <button key={prompt} type="button" onClick={() => void send(prompt)}
                            className="chip !py-1 !text-[11px]">
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${
                    message.role === "user"
                      ? "rounded-tr-sm rounded-br-md bg-coral text-sm text-white"
                      : "rounded-tl-sm rounded-bl-md bg-blue-soft text-sm text-navy shadow-sm"
                  }`}>
                    {message.role === "assistant" ? <Markdown>{message.content}</Markdown> : message.content}
                    {message.role === "assistant" && message.status === "fallback" && (
                      <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                        <TriangleAlert className="h-3 w-3" />
                        {lang === "bm" ? "Ringkasan dikira" : "Computed summary"}
                      </p>
                    )}
                  </div>
                  <span className="mt-1 px-1 text-[10px] text-slate-400">{clock(message.created_at)}</span>
                </div>
              ))}

              {sending && (
                <p className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs text-muted shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {lang === "bm" ? "Menyemak data anda…" : "Checking your data…"}
                </p>
              )}

              {notice && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900">
                  {notice.message}
                  {notice.hint && <p className="mt-1 rounded bg-white/70 p-2 text-slate-700">{notice.hint}</p>}
                </div>
              )}

              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-700">
                  {error}
                  <button type="button" className="ml-2 font-semibold underline"
                          onClick={() => void send(messages.filter((m) => m.role === "user").slice(-1)[0]?.content ?? "")}>
                    {lang === "bm" ? "Cuba lagi" : "Retry"}
                  </button>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="flex items-center justify-between border-t border-line bg-white px-3 pt-2 text-[11px] text-muted">
              <button type="button" className="inline-flex items-center gap-1 hover:text-navy" onClick={newChat}>
                <Plus className="h-3 w-3" />{lang === "bm" ? "Sembang baharu" : "New chat"}
              </button>
              <button type="button" className="hover:text-red-600" onClick={() => void clearChat()}>
                {lang === "bm" ? "Kosongkan" : "Clear"}
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
                setInput("");
              }}
              className="flex items-end gap-2 bg-white p-3"
            >
              <label htmlFor="dock-chat-input" className="sr-only">
                {lang === "bm" ? "Mesej" : "Message"}
              </label>
              <textarea
                id="dock-chat-input"
                rows={1}
                value={input}
                maxLength={2000}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(input);
                    setInput("");
                  }
                }}
                placeholder={lang === "bm" ? "Tanya tentang wang anda…" : "Ask about your money…"}
                className="input max-h-28 min-h-[44px] resize-none !py-2.5 !text-sm"
              />
              <button type="submit" disabled={sending || !input.trim()}
                      aria-label={lang === "bm" ? "Hantar" : "Send"}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral text-white disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
