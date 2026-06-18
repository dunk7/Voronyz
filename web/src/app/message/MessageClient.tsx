"use client";

import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  LogOut,
  PenSquare,
  Send,
  User,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AuthUser = { id: string; username: string };

type ConversationPreview = {
  id: string;
  otherUser: { id: string; username: string };
  lastMessage: {
    body: string;
    createdAt: string;
    isMine: boolean;
  } | null;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  isMine: boolean;
  senderUsername: string;
};

function formatMessageTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatListTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function Avatar({ username }: { username: string }) {
  const letter = username.charAt(0).toUpperCase();
  const hue =
    username.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-inner"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 45% 42%), hsl(${(hue + 40) % 360} 50% 32%))`,
      }}
      aria-hidden
    >
      {letter}
    </div>
  );
}

function VoronyzLogoMark({
  size = 40,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Voronyz"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}

export default function MessageClient() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [newMessageBody, setNewMessageBody] = useState("");
  const [newMessageError, setNewMessageError] = useState("");
  const [newMessageSubmitting, setNewMessageSubmitting] = useState(false);

  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const loadAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/message/auth", { cache: "no-store" });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const res = await fetch("/api/message/conversations", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      /* ignore */
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, { silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setMessagesLoading(true);
      try {
        const res = await fetch(
          `/api/message/conversations/${conversationId}/messages`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.messages ?? []);
      } catch {
        /* ignore */
      } finally {
        if (!silent) setMessagesLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
    const interval = window.setInterval(loadConversations, 5000);
    return () => window.clearInterval(interval);
  }, [user, loadConversations]);

  useEffect(() => {
    if (!user || !activeConversationId) return;
    loadMessages(activeConversationId);
    const interval = window.setInterval(
      () => loadMessages(activeConversationId, { silent: true }),
      3000
    );
    return () => window.clearInterval(interval);
  }, [user, activeConversationId, loadMessages]);

  useEffect(() => {
    if (!messagesLoading && messages.length > 0) {
      scrollToBottom(messages.length <= 3 ? "auto" : "smooth");
    }
  }, [messages, messagesLoading, scrollToBottom]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);
    try {
      const endpoint =
        authMode === "login"
          ? "/api/message/auth"
          : "/api/message/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Something went wrong.");
        return;
      }
      setUser(data.user);
      setPassword("");
    } catch {
      setAuthError("Could not connect. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/message/auth", { method: "DELETE" });
    setUser(null);
    setActiveConversationId(null);
    setMessages([]);
    setConversations([]);
    setMobileShowChat(false);
    setPassword("");
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeConversationId || !draft.trim() || sending) return;

    const body = draft.trim();
    setSending(true);
    setSendError("");
    setDraft("");
    try {
      const res = await fetch(
        `/api/message/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        }
      );
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        loadConversations();
        scrollToBottom();
      } else {
        setDraft(body);
        setSendError(data.error ?? "Could not send message. Try again.");
      }
    } catch {
      setDraft(body);
      setSendError("Could not connect. Try again.");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  async function handleNewMessage(e: React.FormEvent) {
    e.preventDefault();
    setNewMessageError("");
    setNewMessageSubmitting(true);
    try {
      const res = await fetch("/api/message/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUsername: newRecipient.trim().toLowerCase(),
          body: newMessageBody.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewMessageError(data.error ?? "Could not start conversation.");
        return;
      }

      const conversation = data.conversation as ConversationPreview;
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== conversation.id);
        return [conversation, ...filtered];
      });
      setActiveConversationId(conversation.id);
      setMobileShowChat(true);
      setShowNewMessage(false);
      setNewRecipient("");
      setNewMessageBody("");
      await loadMessages(conversation.id);
      await loadConversations();
    } catch {
      setNewMessageError("Could not connect. Please try again.");
    } finally {
      setNewMessageSubmitting(false);
    }
  }

  function selectConversation(id: string) {
    setActiveConversationId(id);
    setMobileShowChat(true);
    setSendError("");
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a0a0b]">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#0a0a0b] px-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.12), transparent 35%)",
          }}
        />
        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mx-auto mb-3 flex items-center justify-center gap-3">
              <VoronyzLogoMark size={44} priority />
              <span className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                <span className="tracking-[0.18em]">VORONYZ</span>{" "}
                <span className="font-medium text-white/85">Messages</span>
              </span>
            </h1>
            <p className="text-sm text-white/55">
              {authMode === "login"
                ? "Sign in with your username and password."
                : "Choose a username and password to get started."}
            </p>
          </div>

          <div className="rounded-3xl bg-white/[0.04] p-1 ring-1 ring-white/10 backdrop-blur-xl">
            <div className="mb-1 grid grid-cols-2 gap-1 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
                className={`rounded-2xl py-2.5 text-sm font-medium transition ${
                  authMode === "login"
                    ? "bg-white text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
                className={`rounded-2xl py-2.5 text-sm font-medium transition ${
                  authMode === "register"
                    ? "bg-white text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Create account
              </button>
            </div>

            <form
              onSubmit={handleAuthSubmit}
              className="rounded-[1.35rem] bg-[#121214] p-6 ring-1 ring-white/5"
            >
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                  Username
                </span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder:text-white/30 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
                    placeholder="yourname"
                    required
                  />
                </div>
              </label>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    authMode === "login" ? "current-password" : "new-password"
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/30 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
                  placeholder={
                    authMode === "register" ? "At least 6 characters" : "••••••••"
                  }
                  required
                  minLength={authMode === "register" ? 6 : 1}
                />
              </label>

              {authError && (
                <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
              >
                {authSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {authMode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#0a0a0b] text-white">
      {/* Sidebar */}
      <aside
        className={`flex w-full shrink-0 flex-col border-r border-white/8 bg-[#0e0e10] md:w-[340px] ${
          mobileShowChat ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Signed in
            </p>
            <p className="font-medium text-white">@{user.username}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setShowNewMessage(true);
                setNewMessageError("");
              }}
              className="rounded-xl p-2.5 text-white/70 transition hover:bg-white/8 hover:text-white"
              title="New message"
            >
              <PenSquare className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl p-2.5 text-white/70 transition hover:bg-white/8 hover:text-white"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationsLoading && conversations.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <VoronyzLogoMark size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm text-white/50">No conversations yet.</p>
              <button
                type="button"
                onClick={() => setShowNewMessage(true)}
                className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {conversations.map((conversation) => {
                const active = conversation.id === activeConversationId;
                const preview = conversation.lastMessage;
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => selectConversation(conversation.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${
                        active
                          ? "bg-white/[0.08]"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <Avatar username={conversation.otherUser.username} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-medium">
                            @{conversation.otherUser.username}
                          </span>
                          {preview && (
                            <span className="shrink-0 text-[11px] text-white/40">
                              {formatListTime(preview.createdAt)}
                            </span>
                          )}
                        </div>
                        {preview && (
                          <p className="mt-0.5 truncate text-sm text-white/45">
                            {preview.isMine ? "You: " : ""}
                            {preview.body}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <section
        className={`flex min-w-0 flex-1 flex-col bg-[#111113] ${
          mobileShowChat ? "flex" : "hidden md:flex"
        }`}
      >
        {!activeConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <h2 className="text-lg font-medium text-white/80">
              Select a conversation
            </h2>
            <p className="mt-2 max-w-sm text-sm text-white/45">
              Choose someone from your list, or start a new message with a
              username.
            </p>
            <button
              type="button"
              onClick={() => setShowNewMessage(true)}
              className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
            >
              New message
            </button>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5">
              <button
                type="button"
                onClick={() => setMobileShowChat(false)}
                className="rounded-lg p-2 text-white/60 transition hover:bg-white/8 hover:text-white md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar username={activeConversation.otherUser.username} />
              <div>
                <h2 className="font-medium">
                  @{activeConversation.otherUser.username}
                </h2>
                <p className="text-xs text-white/40">Direct message</p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                </div>
              ) : (
                <div className="mx-auto flex max-w-2xl flex-col gap-2">
                  {messages.map((message, index) => {
                    const showTime =
                      index === 0 ||
                      new Date(message.createdAt).getTime() -
                        new Date(messages[index - 1].createdAt).getTime() >
                        5 * 60 * 1000;

                    return (
                      <div key={message.id}>
                        {showTime && (
                          <p className="my-4 text-center text-[11px] text-white/35">
                            {formatMessageTime(message.createdAt)}
                          </p>
                        )}
                        <div
                          className={`flex ${
                            message.isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[min(85%,28rem)] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                              message.isMine
                                ? "rounded-br-md bg-indigo-500 text-white"
                                : "rounded-bl-md bg-white/[0.08] text-white/90 ring-1 ring-white/8"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {message.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="border-t border-white/8 bg-[#0e0e10] px-4 py-4"
            >
              {sendError && (
                <p className="mx-auto mb-2 max-w-2xl rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
                  {sendError}
                </p>
              )}
              <div className="mx-auto flex max-w-2xl items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (sendError) setSendError("");
                  }}
                  onKeyDown={handleTextareaKeyDown}
                  rows={1}
                  placeholder="Write a message…"
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white transition hover:bg-indigo-400 disabled:opacity-40"
                  aria-label="Send message"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      {/* New message modal */}
      {showNewMessage && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div
            className="absolute inset-0"
            onClick={() => !newMessageSubmitting && setShowNewMessage(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-3xl bg-[#161618] p-6 ring-1 ring-white/10 shadow-2xl">
            <h3 className="text-lg font-semibold">New message</h3>
            <p className="mt-1 text-sm text-white/50">
              Enter a username to start chatting.
            </p>

            <form onSubmit={handleNewMessage} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                  To
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35">
                    @
                  </span>
                  <input
                    type="text"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    autoCapitalize="none"
                    spellCheck={false}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-8 pr-4 text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
                    placeholder="username"
                    required
                    autoFocus
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                  Message
                </span>
                <textarea
                  value={newMessageBody}
                  onChange={(e) => setNewMessageBody(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
                  placeholder="Say hello…"
                />
              </label>

              {newMessageError && (
                <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
                  {newMessageError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewMessage(false)}
                  disabled={newMessageSubmitting}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newMessageSubmitting || !newRecipient.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                >
                  {newMessageSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
