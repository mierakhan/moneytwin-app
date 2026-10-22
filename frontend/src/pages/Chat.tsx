import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Plus, Send, Sparkles, Trash2, TriangleAlert, User } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { monthLabel, monthKey } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../state/AuthContext";
import type { AIStatus, ChatMessage } from "../lib/types";
import { Badge, ErrorState, Spinner } from "../components/ui";
import Markdown from "../components/Markdown";

type Conversation = { id: string; title: string; updated_at: string };

type LocalMessage = ChatMessage & { source?: string; period?: string };

export default function Chat() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; hint?: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void api.get<AIStatus>("/api/ai/status").then(setStatus).catch(() => setStatus(null));
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get<{ conversations: Conversation[] }>("/api/ai/conversations");
      setConversations(res.conversations);
    } catch {
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const openConversation = async (id: string) => {
    setError(null);
    setNotice(null);
    try {
      const res = await api.get<{ messages: ChatMessage[] }>(`/api/ai/conversations/${id}/messages`);
      setMessages(res.messages);
      setConversationId(id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    }
  };

  const startNew = () => {
    setConversationId(null);
    setMessages([]);
    setNotice(null);
    setError(null);
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    setError(null);
    setNotice(null);
    setSending(true);
    setInput("");
    const optimistic: LocalMessage = { id: `local-${Date.now()}`, role: "user", content: message, status: "ok" };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await api.post<{
        reply: string; conversation_id: string; message_id: string; status: string;
        source: string; data_period: string;
      }>("/api/ai/chat", { message, conversation_id: conversationId, locale: lang });
      setConversationId(res.conversation_id);
      setMessages((prev) => [...prev, {
        id: res.message_id, role: "assistant", content: res.reply, status: res.status,
        source: res.source, period: res.data_period,
      }]);
      void loadConversations();
    } catch (err) {
      if (err instanceof ApiError && (err.code === "ai_not_configured" || err.status === 503)) {
        setNotice({
          message: lang === "bm"
            ? "AI belum disambungkan, jadi ini bukan jawapan AI. Ringkasan di bawah dikira oleh pelayan daripada rekod anda."
            : "AI is not connected, so this is not an AI answer. The summary below is computed by the backend from your records.",
          hint: err.hint,
        });
        setMessages((prev) => prev.slice(0, -1));
        setInput(message);
      } else if (err instanceof ApiError) {
        setError(err.message);
        setMessages((prev) => prev.slice(0, -1));
        setInput(message);
      } else {
        setError(t("somethingWrong"));
      }
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    if (!conversationId) {
      startNew();
      return;
    }
    try {
      await api.del(`/api/ai/conversations/${conversationId}`);
      startNew();
      void loadConversations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    }
  };

  const welcome = status?.welcome?.[lang] ?? (lang === "bm"
    ? "Hai! Saya MoneyTwin AI. Saya boleh bantu semak perbelanjaan, bajet dan simulasi kewangan."
    : "Hi! I'm MoneyTwin AI. I can help you understand your spending, budget and what-if scenarios.");
  const suggestions = status?.suggestions?.[lang] ?? [
    "Where did my money go?", "Am I overspending?", "How much should I save monthly?",
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("navChat")}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{t("aiAssistant")}</h1>
          <p className="mt-1 text-sm text-muted">
            {lang === "bm" ? "Menggunakan bajet dan transaksi anda sahaja." : "Uses only your own budgets and transactions."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={status?.configured ? "jade" : "amber"}>
            {status?.configured
              ? `${lang === "bm" ? "AI" : "AI"}: ${status.provider}`
              : t("aiNotConnected")}
          </Badge>
          <button type="button" className="chip !py-1.5 text-xs" onClick={startNew}><Plus className="mr-1 inline h-3.5 w-3.5" />{lang === "bm" ? "Sembang baharu" : "New chat"}</button>
          <button type="button" className="chip !py-1.5 text-xs text-red-600" onClick={() => void clearChat()}>
            <Trash2 className="mr-1 inline h-3.5 w-3.5" />{t("clearChat")}
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="card p-3">
            <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {lang === "bm" ? "Sejarah" : "History"}
            </p>
            {conversations.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted">{lang === "bm" ? "Belum ada sembang." : "No chats yet."}</p>
            ) : (
              <ul className="space-y-1">
                {conversations.map((conv) => (
                  <li key={conv.id}>
                    <button type="button" onClick={() => void openConversation(conv.id)}
                            className={`w-full truncate rounded-lg px-2 py-2 text-left text-sm ${conversationId === conv.id ? "bg-canvas font-semibold text-navy" : "text-slate-600 hover:bg-slate-50"}`}>
                      {conv.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-3 rounded-xl border border-line bg-white p-3 text-xs text-muted">
            <p className="font-semibold text-navy">{lang === "bm" ? "Konteks data" : "Data context"}</p>
            <p className="mt-1">{monthLabel(monthKey(), lang)}</p>
            <p className="mt-1">{lang === "bm" ? "Akaun" : "Account"}: {user?.email}</p>
          </div>
        </aside>

        <section className="card flex min-h-[62vh] flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            {messages.length === 0 && (
              <div className="flex gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-white"><Bot className="h-4 w-4" /></span>
                <div className="max-w-lg rounded-2xl rounded-tl-sm bg-canvas px-4 py-3 text-sm leading-relaxed text-slate-700">
                  {welcome}
                </div>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pl-11">
                {suggestions.map((s) => (
                  <button key={s} type="button" className="chip !text-xs" onClick={() => void send(s)}>{s}</button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-white"><Bot className="h-4 w-4" /></span>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user" ? "rounded-tr-sm bg-navy text-white" : "rounded-tl-sm bg-canvas text-slate-700"
                }`}>
                  {msg.role === "assistant" ? (
                    <Markdown>{msg.content}</Markdown>
                  ) : (
                    <p className="whitespace-pre-line">{msg.content}</p>
                  )}
                  {msg.role === "assistant" && msg.status === "fallback" && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                      <TriangleAlert className="h-3 w-3" />{t("computedSummary")}
                    </p>
                  )}
                </div>
                {msg.role === "user" && (
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600"><User className="h-4 w-4" /></span>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white"><Bot className="h-4 w-4" /></span>
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
                  <p className="mt-2 rounded-lg bg-white/70 p-2 text-xs leading-relaxed text-slate-700">
                    <strong className="block text-navy">{lang === "bm" ? "Ringkasan dikira" : "Computed summary"}</strong>
                    {notice.hint}
                  </p>
                )}
                <p className="mt-2 text-[11px]">{t("aiNotConnectedBody")}</p>
              </div>
            )}

            {error && <ErrorState message={error} onRetry={() => void send(input || "Am I overspending?")} retryLabel={t("retry")} />}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="border-t border-line p-3 sm:p-4">
            <div className="flex items-end gap-2">
              <label htmlFor="chat-input" className="sr-only">{t("typeMessage")}</label>
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder={t("typeMessage")}
                className="input max-h-32 min-h-[46px] resize-none"
                maxLength={2000}
              />
              <button type="submit" className="btn-jade !px-4 !py-3" disabled={sending || input.trim().length === 0} aria-label={t("sendMessage")}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
              <Sparkles className="h-3 w-3" />
              {lang === "bm" ? "AI menerangkan; pelayan mengira. Tiada nasihat kewangan dijamin." : "The AI explains; the server calculates. No guaranteed financial advice."}
            </p>
          </form>
        </section>
      </div>

      {!status && <Spinner label={t("loading")} />}
    </div>
  );
}
