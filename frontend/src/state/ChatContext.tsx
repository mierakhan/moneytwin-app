import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { api, ApiError } from "../lib/api";
import type { AIStatus, ChatMessage } from "../lib/types";
import { useAuth } from "./AuthContext";

export type LocalMessage = ChatMessage & { source?: string; period?: string };
type Notice = { message: string; hint?: string } | null;

type ChatValue = {
  status: AIStatus | null;
  messages: LocalMessage[];
  conversationId: string | null;
  conversations: Array<{ id: string; title: string; updated_at: string }>;
  sending: boolean;
  error: string | null;
  notice: Notice;
  send: (text: string) => Promise<void>;
  newChat: () => void;
  clearChat: () => Promise<void>;
  openConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
};

const ChatContext = createContext<ChatValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatValue["conversations"]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const restored = useRef(false);

  const storageKey = user ? `mt_chat_conv_${user.id}` : "mt_chat_conv";

  const refreshConversations = useCallback(async () => {
    try {
      const res = await api.get<{ conversations: ChatValue["conversations"] }>("/api/ai/conversations");
      setConversations(res.conversations);
    } catch {
      setConversations([]);
    }
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setError(null);
    setNotice(null);
    try {
      const res = await api.get<{ messages: ChatMessage[] }>(`/api/ai/conversations/${id}/messages`);
      setMessages(res.messages);
      setConversationId(id);
      localStorage.setItem(storageKey, id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not open that conversation");
    }
  }, [storageKey]);

  // Restore the last conversation once per signed-in user so the widget and the
  // full page share one thread.
  useEffect(() => {
    if (!user || restored.current) return;
    restored.current = true;
    void api.get<AIStatus>("/api/ai/status").then(setStatus).catch(() => setStatus(null));
    void refreshConversations();
    const saved = localStorage.getItem(storageKey);
    if (saved) void openConversation(saved);
  }, [user, storageKey, openConversation, refreshConversations]);

  useEffect(() => {
    if (!user) {
      restored.current = false;
      setMessages([]);
      setConversationId(null);
      setConversations([]);
      setNotice(null);
      setError(null);
    }
  }, [user]);

  const send = useCallback(async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    setError(null);
    setNotice(null);
    setSending(true);
    const optimistic: LocalMessage = {
      id: `local-${Date.now()}`, role: "user", content: message, status: "ok",
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await api.post<{
        reply: string; conversation_id: string; message_id: string; status: string;
        source: string; data_period: string;
      }>("/api/ai/chat", { message, conversation_id: conversationId });
      setConversationId(res.conversation_id);
      localStorage.setItem(storageKey, res.conversation_id);
      setMessages((prev) => [...prev, {
        id: res.message_id, role: "assistant", content: res.reply, status: res.status,
        source: res.source, period: res.data_period,
      }]);
      void refreshConversations();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      if (err instanceof ApiError && (err.code === "ai_not_configured" || err.status === 503)) {
        setNotice({
          message: "AI is not connected, so this is not an AI answer. The summary below is computed by the backend from your records.",
          hint: err.hint,
        });
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }, [conversationId, sending, storageKey, refreshConversations]);

  const newChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setNotice(null);
    setError(null);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const clearChat = useCallback(async () => {
    if (!conversationId) {
      newChat();
      return;
    }
    try {
      await api.del(`/api/ai/conversations/${conversationId}`);
      newChat();
      void refreshConversations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not clear the chat");
    }
  }, [conversationId, newChat, refreshConversations]);

  const value = useMemo<ChatValue>(() => ({
    status, messages, conversationId, conversations, sending, error, notice,
    send, newChat, clearChat, openConversation, refreshConversations,
  }), [status, messages, conversationId, conversations, sending, error, notice,
       send, newChat, clearChat, openConversation, refreshConversations]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}
