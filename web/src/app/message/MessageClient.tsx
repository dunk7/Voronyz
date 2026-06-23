"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowUp,
  Camera,
  Check,
  FileText,
  ImageIcon,
  Loader2,
  LogOut,
  Mic,
  Paperclip,
  PenSquare,
  Settings,
  Trash2,
  User,
  Users,
  Video,
  X,
  ZoomIn,
} from "lucide-react";
import { AudioMessagePlayer } from "@/components/message/AudioMessagePlayer";
import {
  formatVoiceDuration,
  useVoiceRecorder,
} from "@/components/message/useVoiceRecorder";
import {
  GroupAvatarStack,
  MessengerAvatar,
} from "@/components/message/MessengerAvatar";
import {
  MediaViewer,
  type MediaViewerItem,
} from "@/components/message/MediaViewer";
import { validateMessageAttachment, shouldUseChunkedUpload } from "@/lib/messageAttachment";
import {
  isImageUploadFile,
  prepareAvatarImage,
  prepareMessageImage,
} from "@/lib/prepareImageUpload";
import { uploadMessageAttachmentChunks } from "@/lib/uploadMessageAttachment.client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AuthUser = { id: string; username: string; avatarUrl?: string | null };

type ConversationMemberPreview = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
};

type ConversationPreview =
  | {
      id: string;
      isGroup: false;
      otherUser: ConversationMemberPreview;
      lastMessage: LastMessagePreview | null;
      updatedAt: string;
    }
  | {
      id: string;
      isGroup: true;
      name: string;
      members: ConversationMemberPreview[];
      memberCount: number;
      lastMessage: LastMessagePreview | null;
      updatedAt: string;
    };

type LastMessagePreview = {
  body: string;
  createdAt: string;
  isMine: boolean;
  hasAttachment?: boolean;
  isImage?: boolean;
  isVideo?: boolean;
  isAudio?: boolean;
};

type MessageAttachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  durationSeconds?: number;
};

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  isMine: boolean;
  senderUsername: string;
  senderAvatarUrl?: string | null;
  attachment: MessageAttachment | null;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readApiError(
  res: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // Response body was empty or not JSON.
  }
  return fallback;
}

function isVideoAttachment(attachment: MessageAttachment | null | undefined) {
  return Boolean(attachment?.mimeType.startsWith("video/"));
}

function isAudioAttachment(attachment: MessageAttachment | null | undefined) {
  return Boolean(attachment?.mimeType.startsWith("audio/"));
}

function isMediaAttachment(attachment: MessageAttachment | null | undefined) {
  return isImageAttachment(attachment) || isVideoAttachment(attachment);
}

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

function isImageAttachment(attachment: MessageAttachment | null | undefined) {
  return Boolean(attachment?.mimeType.startsWith("image/"));
}

function conversationTitle(conversation: ConversationPreview) {
  return conversation.isGroup
    ? conversation.name
    : `@${conversation.otherUser.username}`;
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

function TypingIndicator({ label }: { label?: string }) {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md bg-white/[0.08] px-4 py-3 ring-1 ring-white/8">
        {label && (
          <p className="mb-1.5 text-[11px] text-white/45">{label}</p>
        )}
        <div className="flex items-center gap-1">
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-white/55"
            style={{ animationDelay: "0ms", animationDuration: "1s" }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-white/55"
            style={{ animationDelay: "150ms", animationDuration: "1s" }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-white/55"
            style={{ animationDelay: "300ms", animationDuration: "1s" }}
          />
        </div>
      </div>
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

function MessageBubble({
  message,
  onMediaClick,
  showSender,
}: {
  message: ChatMessage;
  onMediaClick: (item: MediaViewerItem) => void;
  showSender?: boolean;
}) {
  const hasText = Boolean(message.body.trim());
  const attachment = message.attachment;
  const isImage = isImageAttachment(attachment);
  const isVideo = isVideoAttachment(attachment);
  const isAudio = isAudioAttachment(attachment);

  return (
    <div className={`max-w-[min(92%,28rem)] ${showSender ? "space-y-1" : ""}`}>
      {showSender && !message.isMine && (
        <p className="px-1 text-[11px] font-medium text-white/45">
          @{message.senderUsername}
        </p>
      )}
      <div
        className={`overflow-hidden rounded-2xl shadow-sm ${
          message.isMine
            ? "rounded-br-md bg-indigo-500 text-white"
            : "rounded-bl-md bg-white/[0.08] text-white/90 ring-1 ring-white/8"
        }`}
      >
        {attachment && isImage && (
          <button
            type="button"
            onClick={() =>
              onMediaClick({
                url: attachment.url,
                mimeType: attachment.mimeType,
                fileName: attachment.fileName,
              })
            }
            className="group relative block w-full touch-manipulation text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.url}
              alt={attachment.fileName}
              className="max-h-64 w-full object-cover sm:max-h-72"
              loading="lazy"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25 group-active:bg-black/25">
              <ZoomIn className="h-8 w-8 text-white opacity-70 drop-shadow transition sm:opacity-0 sm:group-hover:opacity-100" />
            </span>
          </button>
        )}

        {attachment && isVideo && (
          <button
            type="button"
            onClick={() =>
              onMediaClick({
                url: attachment.url,
                mimeType: attachment.mimeType,
                fileName: attachment.fileName,
              })
            }
            className="group relative block w-full touch-manipulation text-left"
          >
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={attachment.url}
              className="max-h-64 w-full bg-black object-contain sm:max-h-72"
              muted
              playsInline
              preload="metadata"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
              <div className="rounded-full bg-black/50 p-3 ring-1 ring-white/20">
                <Video className="h-7 w-7 text-white" />
              </div>
            </span>
          </button>
        )}

        {attachment && isAudio && (
          <AudioMessagePlayer
            url={attachment.url}
            isMine={message.isMine}
            durationSeconds={attachment.durationSeconds}
          />
        )}

        {attachment && !isMediaAttachment(attachment) && !isAudio && (
        <a
          href={attachment.url}
          download={attachment.fileName}
          className={`flex items-center gap-3 px-4 py-3 transition ${
            message.isMine
              ? "hover:bg-indigo-400/40"
              : "hover:bg-white/[0.06]"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              message.isMine ? "bg-white/15" : "bg-white/10"
            }`}
          >
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{attachment.fileName}</p>
            <p
              className={`text-xs ${
                message.isMine ? "text-indigo-100" : "text-white/45"
              }`}
            >
              {formatFileSize(attachment.sizeBytes)} · Tap to download
            </p>
          </div>
        </a>
      )}

      {hasText && (
        <p
          className={`whitespace-pre-wrap break-words px-4 py-2.5 text-[15px] leading-relaxed ${
            attachment ? "pt-2" : ""
          }`}
        >
          {message.body}
        </p>
      )}
      </div>
    </div>
  );
}

type PendingAttachment = {
  file: File;
  previewUrl: string | null;
  voiceDuration?: number;
};

function PendingAttachmentPreview({
  file,
  previewUrl,
  durationSeconds,
  onRemove,
}: {
  file: File;
  previewUrl: string | null;
  durationSeconds?: number;
  onRemove: () => void;
}) {
  const isImage = isImageUploadFile(file);
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  return (
    <div className="mx-auto mb-3 flex max-w-2xl items-center gap-3 rounded-2xl bg-white/[0.04] p-2 ring-1 ring-white/10">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
        {isImage && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : isVideo && previewUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={previewUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
        ) : isAudio && previewUrl ? (
          <div className="flex h-full w-full items-center justify-center bg-indigo-500/20">
            <Mic className="h-6 w-6 text-indigo-300" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileText className="h-6 w-6 text-white/50" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/90">
          {isAudio ? "Voice message" : file.name}
        </p>
        <p className="text-xs text-white/45">
          {isAudio
            ? durationSeconds
              ? formatVoiceDuration(durationSeconds)
              : "Ready to send"
            : formatFileSize(file.size)}
        </p>
      </div>
      {isAudio && previewUrl && (
        <div className="max-w-[11rem] shrink-0 overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/10">
          <AudioMessagePlayer
            url={previewUrl}
            isMine={false}
            durationSeconds={durationSeconds}
          />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-xl p-2 text-white/50 transition hover:bg-white/8 hover:text-white"
        aria-label="Remove attachment"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
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
  const [newMessageMode, setNewMessageMode] = useState<"direct" | "group">("direct");
  const [newRecipient, setNewRecipient] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState("");
  const [newMessageBody, setNewMessageBody] = useState("");
  const [newMessageError, setNewMessageError] = useState("");
  const [newMessageSubmitting, setNewMessageSubmitting] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>(
    []
  );
  const [preparingAttachment, setPreparingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    fraction: number;
  } | null>(null);
  const [composeDragOver, setComposeDragOver] = useState(false);
  const [mediaViewer, setMediaViewer] = useState<MediaViewerItem | null>(null);
  const [chatPresence, setChatPresence] = useState<{
    isOnline: boolean;
    typingUsers: string[];
  }>({ isOnline: false, typingUsers: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingPingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voice = useVoiceRecorder();
  const {
    isRecording: isVoiceRecording,
    seconds: voiceSeconds,
    error: voiceError,
    start: startVoice,
    stop: stopVoice,
    cancel: cancelVoice,
  } = voice;

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
        if (data.conversation) {
          const conv = data.conversation;
          if (conv.isGroup) {
            setChatPresence({
              isOnline: conv.members.some((m: ConversationMemberPreview) => m.isOnline),
              typingUsers:
                conv.typingUsers?.map((t: { username: string }) => t.username) ?? [],
            });
          } else if (conv.otherUser) {
            setChatPresence({
              isOnline: Boolean(conv.otherUser.isOnline),
              typingUsers:
                conv.typingUsers?.map((t: { username: string }) => t.username) ??
                (conv.otherUser.isTyping ? [conv.otherUser.username] : []),
            });
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!silent) setMessagesLoading(false);
      }
    },
    []
  );

  const sendPresence = useCallback(
    async (
      payload: { typing?: boolean; conversationId?: string } = {}
    ) => {
      try {
        await fetch("/api/message/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        /* ignore */
      }
    },
    []
  );

  const stopTypingPing = useCallback(() => {
    if (typingPingRef.current) {
      clearTimeout(typingPingRef.current);
      typingPingRef.current = null;
    }
    if (typingRefreshRef.current) {
      clearInterval(typingRefreshRef.current);
      typingRefreshRef.current = null;
    }
  }, []);

  const startTypingPing = useCallback(
    (conversationId: string) => {
      stopTypingPing();
      const ping = () => {
        void sendPresence({ typing: true, conversationId });
      };
      typingPingRef.current = setTimeout(ping, 350);
      typingRefreshRef.current = setInterval(ping, 2000);
    },
    [sendPresence, stopTypingPing]
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
    if (!user) return;
    void sendPresence();
    const interval = window.setInterval(() => sendPresence(), 20_000);
    return () => window.clearInterval(interval);
  }, [user, sendPresence]);

  useEffect(() => {
    if (!activeConversationId) {
      stopTypingPing();
      return;
    }

    if (draft.trim()) {
      startTypingPing(activeConversationId);
    } else {
      stopTypingPing();
      void sendPresence({ typing: false });
    }

    return () => stopTypingPing();
  }, [
    draft,
    activeConversationId,
    startTypingPing,
    stopTypingPing,
    sendPresence,
  ]);

  useEffect(() => {
    if (chatPresence.typingUsers.length > 0) scrollToBottom();
  }, [chatPresence.typingUsers, scrollToBottom]);

  const typingLabel = useMemo(() => {
    const users = chatPresence.typingUsers;
    if (users.length === 0) return undefined;
    if (users.length === 1) return `@${users[0]} is typing…`;
    if (users.length === 2) return `@${users[0]} and @${users[1]} are typing…`;
    return "Several people are typing…";
  }, [chatPresence.typingUsers]);

  useEffect(() => {
    if (!messagesLoading && messages.length > 0) {
      scrollToBottom(messages.length <= 3 ? "auto" : "smooth");
    }
  }, [messages, messagesLoading, scrollToBottom]);

  const pendingAttachmentsRef = useRef(pendingAttachments);
  pendingAttachmentsRef.current = pendingAttachments;

  useEffect(() => {
    return () => {
      for (const attachment of pendingAttachmentsRef.current) {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      }
    };
  }, []);

  const clearPendingAttachments = useCallback(() => {
    setPendingAttachments((prev) => {
      for (const attachment of prev) {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      }
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removePendingAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }, []);

  const createPendingAttachment = useCallback(
    (file: File, voiceDuration?: number): PendingAttachment => {
      const previewUrl =
        isImageUploadFile(file) ||
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/")
          ? URL.createObjectURL(file)
          : null;
      return {
        file,
        previewUrl,
        voiceDuration: file.type.startsWith("audio/") ? voiceDuration : undefined,
      };
    },
    []
  );

  const setPendingVoiceAttachment = useCallback(
    (file: File, voiceDuration?: number) => {
      setPendingAttachments((prev) => {
        for (const attachment of prev) {
          if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
        }
        return [createPendingAttachment(file, voiceDuration)];
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [createPendingAttachment]
  );

  const attachPendingFiles = useCallback(
    async (rawFiles: File[]) => {
      if (rawFiles.length === 0) return;
      setSendError("");
      setPreparingAttachment(true);
      try {
        const nextAttachments: PendingAttachment[] = [];
        for (const rawFile of rawFiles) {
          let file = rawFile;
          if (isImageUploadFile(rawFile)) {
            file = await prepareMessageImage(rawFile);
          }
          const validationError = validateMessageAttachment(file);
          if (validationError) {
            setSendError(validationError);
            continue;
          }
          nextAttachments.push(createPendingAttachment(file));
        }
        if (nextAttachments.length > 0) {
          setPendingAttachments((prev) => [...prev, ...nextAttachments]);
        }
      } catch {
        setSendError(
          "Could not prepare that photo. Try saving it as JPEG or PNG first."
        );
      } finally {
        setPreparingAttachment(false);
      }
    },
    [createPendingAttachment]
  );

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await attachPendingFiles(files);
    },
    [attachPendingFiles]
  );

  const handleComposeDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setComposeDragOver(false);
      const files = Array.from(e.dataTransfer.files ?? []);
      await attachPendingFiles(files);
    },
    [attachPendingFiles]
  );

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
        credentials: "same-origin",
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });
      if (!res.ok) {
        setAuthError(
          await readApiError(
            res,
            res.status >= 500
              ? "Messenger is temporarily unavailable. Try again shortly."
              : "Something went wrong."
          )
        );
        return;
      }
      const data = await res.json();
      if (!data.user) {
        setAuthError("Something went wrong.");
        return;
      }
      setUser(data.user);
      setPassword("");
    } catch {
      setAuthError("Could not connect. Check your internet and try again.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  useEffect(() => {
    return () => {
      cancelVoice();
    };
  }, [cancelVoice]);

  const sendMessageWithFile = useCallback(
    async (
      file: File,
      body: string,
      voiceDuration?: number,
      uploadMeta?: { current: number; total: number }
    ) => {
      if (!activeConversationId) return false;

      const reportProgress = (fraction: number) => {
        if (uploadMeta) {
          setUploadProgress({
            current: uploadMeta.current,
            total: uploadMeta.total,
            fraction,
          });
        } else {
          setUploadProgress({ current: 1, total: 1, fraction });
        }
      };

      try {
        if (shouldUseChunkedUpload(file.size)) {
          reportProgress(0);
          const upload = await uploadMessageAttachmentChunks(
            activeConversationId,
            file,
            {
              durationSeconds: voiceDuration,
              onProgress: reportProgress,
            }
          );
          setUploadProgress(null);

          const res = await fetch(
            `/api/message/conversations/${activeConversationId}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                body,
                upload,
              }),
            }
          );
          const data = await res.json();
          if (res.ok && data.message) {
            setMessages((prev) => [...prev, data.message]);
            loadConversations();
            scrollToBottom();
            return true;
          }
          setSendError(data.error ?? "Could not send message. Try again.");
          return false;
        }

        const formData = new FormData();
        if (body) formData.append("body", body);
        formData.append("file", file);
        if (voiceDuration && voiceDuration > 0) {
          formData.append("attachmentDurationSeconds", String(voiceDuration));
        }

        const res = await fetch(
          `/api/message/conversations/${activeConversationId}/messages`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        if (res.ok && data.message) {
          setMessages((prev) => [...prev, data.message]);
          loadConversations();
          scrollToBottom();
          return true;
        }
        setSendError(data.error ?? "Could not send message. Try again.");
        return false;
      } catch (err) {
        setUploadProgress(null);
        setSendError(
          err instanceof Error ? err.message : "Could not send message. Try again."
        );
        return false;
      }
    },
    [activeConversationId, loadConversations, scrollToBottom]
  );

  async function finishVoiceRecording(sendImmediately: boolean) {
    const elapsed = voiceSeconds;
    const file = await stopVoice();
    if (!file) {
      if (elapsed >= 1) {
        setSendError("Recording was too short. Hold for at least a moment.");
      }
      return;
    }

    if (sendImmediately && !draft.trim()) {
      setSending(true);
      setSendError("");
      stopTypingPing();
      void sendPresence({ typing: false });
      const ok = await sendMessageWithFile(file, "", elapsed);
      setSending(false);
      if (!ok) setPendingVoiceAttachment(file, elapsed);
      return;
    }

    setPendingVoiceAttachment(file, elapsed);
  }

  async function handleMicClick() {
    if (isVoiceRecording) {
      await finishVoiceRecording(true);
      return;
    }
    if (pendingAttachments.length > 0) {
      setSendError("Remove the current attachments before recording.");
      return;
    }
    setSendError("");
    const result = await startVoice();
    if (!result.ok) {
      setSendError(result.error);
    }
  }

  async function handleLogout() {
    cancelVoice();
    stopTypingPing();
    await sendPresence({ typing: false });
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
    const body = draft.trim();
    if (!activeConversationId || sending || (!body && pendingAttachments.length === 0)) return;

    setSending(true);
    setSendError("");

    const savedDraft = draft;
    const savedAttachments = pendingAttachments;
    setDraft("");
    clearPendingAttachments();
    stopTypingPing();
    void sendPresence({ typing: false });

    try {
      if (savedAttachments.length > 0) {
        for (let index = 0; index < savedAttachments.length; index += 1) {
          const attachment = savedAttachments[index];
          const messageBody = index === 0 ? body : "";
          const ok = await sendMessageWithFile(
            attachment.file,
            messageBody,
            attachment.voiceDuration,
            { current: index + 1, total: savedAttachments.length }
          );
          if (!ok) {
            setDraft(savedDraft);
            setPendingAttachments(savedAttachments.slice(index));
            break;
          }
        }
      } else {
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
          setDraft(savedDraft);
          setSendError(data.error ?? "Could not send message. Try again.");
        }
      }
    } catch {
      setDraft(savedDraft);
      if (savedAttachments.length > 0) setPendingAttachments(savedAttachments);
      setSendError("Could not connect. Try again.");
    } finally {
      setSending(false);
      setUploadProgress(null);
      textareaRef.current?.focus();
    }
  }

  async function handleNewMessage(e: React.FormEvent) {
    e.preventDefault();
    setNewMessageError("");
    setNewMessageSubmitting(true);
    try {
      const payload =
        newMessageMode === "group"
          ? {
              type: "group",
              name: newGroupName.trim(),
              memberUsernames: newGroupMembers
                .split(/[,\s]+/)
                .map((s) => s.trim().replace(/^@/, ""))
                .filter(Boolean),
              body: newMessageBody.trim() || undefined,
            }
          : {
              recipientUsername: newRecipient.trim().toLowerCase(),
              body: newMessageBody.trim() || undefined,
            };

      const res = await fetch("/api/message/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      setNewGroupName("");
      setNewGroupMembers("");
      setNewMessageBody("");
      await loadMessages(conversation.id);
      await loadConversations();
    } catch {
      setNewMessageError("Could not connect. Please try again.");
    } finally {
      setNewMessageSubmitting(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const prepared = isImageUploadFile(file)
        ? await prepareAvatarImage(file)
        : file;
      const formData = new FormData();
      formData.append("avatar", prepared);
      const res = await fetch("/api/message/profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.error ?? "Could not update profile picture.");
        return;
      }
      setUser(data.user);
      await loadConversations();
    } catch {
      setAvatarError(
        "Could not upload that photo. Try saving it as JPEG or PNG first."
      );
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("remove", "true");
      const res = await fetch("/api/message/profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.error ?? "Could not remove profile picture.");
        return;
      }
      setUser(data.user);
      await loadConversations();
    } catch {
      setAvatarError("Could not remove avatar.");
    } finally {
      setAvatarUploading(false);
    }
  }

  function resetPasswordForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess("");
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await fetch("/api/message/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      if (!res.ok) {
        setPasswordError(
          await readApiError(res, "Could not change password. Try again.")
        );
        return;
      }
      resetPasswordForm();
      setPasswordSuccess("Password updated.");
    } catch {
      setPasswordError("Could not connect. Try again.");
    } finally {
      setPasswordSubmitting(false);
    }
  }

  async function handleDeleteConversation() {
    if (!activeConversationId || !activeConversation) return;

    const label = activeConversation.isGroup
      ? `Delete "${activeConversation.name}" for everyone?`
      : `Delete your conversation with @${activeConversation.otherUser.username}?`;
    const confirmed = window.confirm(
      `${label}\n\nAll messages will be permanently removed for every participant.`
    );
    if (!confirmed) return;

    setSendError("");
    setDeletingConversation(true);
    try {
      const res = await fetch(
        `/api/message/conversations/${activeConversationId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        setSendError(
          await readApiError(res, "Could not delete conversation. Try again.")
        );
        return;
      }

      const deletedId = activeConversationId;
      setConversations((prev) => prev.filter((c) => c.id !== deletedId));
      setActiveConversationId(null);
      setMessages([]);
      setMobileShowChat(false);
      setChatPresence({ isOnline: false, typingUsers: [] });
      await loadConversations();
    } catch {
      setSendError("Could not connect. Try again.");
    } finally {
      setDeletingConversation(false);
    }
  }

  function selectConversation(id: string) {
    cancelVoice();
    setActiveConversationId(id);
    setMobileShowChat(true);
    setSendError("");
    clearPendingAttachments();
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }

  async function handleTextareaPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const images = Array.from(e.clipboardData.files).filter((file) =>
      isImageUploadFile(file)
    );
    if (images.length > 0) {
      e.preventDefault();
      await attachPendingFiles(images);
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
              method="post"
              action={
                authMode === "login"
                  ? "/api/message/auth"
                  : "/api/message/auth/register"
              }
              autoComplete="on"
              className="rounded-[1.35rem] bg-[#121214] p-6 ring-1 ring-white/5"
            >
              <label className="block" htmlFor="message-username">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                  Username
                </span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    id="message-username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="text"
                    enterKeyHint="next"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder:text-white/30 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
                    placeholder="yourname"
                    required
                  />
                </div>
              </label>

              <label className="mt-4 block" htmlFor="message-password">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                  Password
                </span>
                <input
                  id="message-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    authMode === "login" ? "current-password" : "new-password"
                  }
                  enterKeyHint="go"
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
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => {
              setShowProfile(true);
              setAvatarError("");
              resetPasswordForm();
            }}
            className="flex min-w-0 items-center gap-3 rounded-xl py-1 pr-2 text-left transition hover:bg-white/5"
          >
            <MessengerAvatar
              username={user.username}
              avatarUrl={user.avatarUrl}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                Signed in
              </p>
              <p className="truncate font-medium text-white">@{user.username}</p>
            </div>
          </button>
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
              onClick={() => {
                setShowProfile(true);
                setAvatarError("");
                resetPasswordForm();
              }}
              className="rounded-xl p-2.5 text-white/70 transition hover:bg-white/8 hover:text-white"
              title="Profile"
            >
              <Settings className="h-5 w-5" />
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
                      {conversation.isGroup ? (
                        <GroupAvatarStack
                          members={conversation.members.filter(
                            (m) => m.username !== user.username
                          )}
                        />
                      ) : (
                        <MessengerAvatar
                          username={conversation.otherUser.username}
                          avatarUrl={conversation.otherUser.avatarUrl}
                          online={conversation.otherUser.isOnline}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-medium">
                            {conversationTitle(conversation)}
                          </span>
                          {preview && (
                            <span className="shrink-0 text-[11px] text-white/40">
                              {formatListTime(preview.createdAt)}
                            </span>
                          )}
                        </div>
                        {conversation.isGroup && (
                          <p className="mt-0.5 text-[11px] text-white/35">
                            {conversation.memberCount} members
                          </p>
                        )}
                        {preview && (
                          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-white/45">
                            {preview.isMine ? (
                              <span className="shrink-0">You: </span>
                            ) : null}
                            {preview.hasAttachment && (
                              <span className="inline-flex shrink-0 items-center">
                                {preview.isAudio ? (
                                  <Mic className="h-3.5 w-3.5" />
                                ) : preview.isVideo ? (
                                  <Video className="h-3.5 w-3.5" />
                                ) : preview.isImage ? (
                                  <ImageIcon className="h-3.5 w-3.5" />
                                ) : (
                                  <Paperclip className="h-3.5 w-3.5" />
                                )}
                              </span>
                            )}
                            <span className="truncate">{preview.body}</span>
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
            <header className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <button
                type="button"
                onClick={() => setMobileShowChat(false)}
                className="rounded-lg p-2 text-white/60 transition hover:bg-white/8 hover:text-white md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              {activeConversation.isGroup ? (
                <GroupAvatarStack
                  members={activeConversation.members.filter(
                    (m) => m.username !== user.username
                  )}
                />
              ) : (
                <MessengerAvatar
                  username={activeConversation.otherUser.username}
                  avatarUrl={activeConversation.otherUser.avatarUrl}
                  online={chatPresence.isOnline}
                />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-medium">
                  {conversationTitle(activeConversation)}
                </h2>
                <p className="truncate text-xs text-white/40">
                  {chatPresence.typingUsers.length > 0 ? (
                    <span className="text-indigo-300">{typingLabel}</span>
                  ) : activeConversation.isGroup ? (
                    `${activeConversation.memberCount} members`
                  ) : chatPresence.isOnline ? (
                    <span className="text-emerald-400/90">Online</span>
                  ) : (
                    "Offline"
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDeleteConversation}
                disabled={deletingConversation || sending}
                className="rounded-lg p-2 text-white/45 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                aria-label="Delete conversation"
                title="Delete conversation"
              >
                {deletingConversation ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 sm:py-5">
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
                          <MessageBubble
                            message={message}
                            onMediaClick={setMediaViewer}
                            showSender={activeConversation.isGroup}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {chatPresence.typingUsers.length > 0 && (
                    <TypingIndicator label={typingLabel} />
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form
              onSubmit={handleSendMessage}
              onDragOver={(e) => {
                e.preventDefault();
                setComposeDragOver(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setComposeDragOver(false);
                }
              }}
              onDrop={handleComposeDrop}
              className={`border-t border-white/8 bg-[#0e0e10] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition sm:px-4 sm:py-4 ${
                composeDragOver ? "bg-indigo-500/5 ring-1 ring-inset ring-indigo-400/30" : ""
              }`}
            >
              {(voiceError || sendError) && !isVoiceRecording && (
                <p className="mx-auto mb-2 max-w-2xl rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
                  {voiceError ?? sendError}
                </p>
              )}
              {isVoiceRecording ? (
                <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3 ring-1 ring-red-500/25">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">Recording…</p>
                    <p className="text-xs tabular-nums text-white/50">
                      {formatVoiceDuration(voiceSeconds)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cancelVoice()}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/8"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => finishVoiceRecording(true)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90"
                    aria-label="Send voice message"
                  >
                    <Check className="h-5 w-5 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                <>
              {sendError && !voiceError && (
                <p className="mx-auto mb-2 max-w-2xl rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
                  {sendError}
                </p>
              )}
              {preparingAttachment && (
                <div className="mx-auto mb-3 flex max-w-2xl items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-white/50" />
                  <p className="text-sm text-white/60">Preparing files…</p>
                </div>
              )}
              {uploadProgress !== null && (
                <div className="mx-auto mb-3 max-w-2xl rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                  <div className="mb-2 flex items-center justify-between text-sm text-white/60">
                    <span>
                      {uploadProgress.total > 1
                        ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}…`
                        : "Uploading…"}
                    </span>
                    <span>{Math.round(uploadProgress.fraction * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-indigo-400 transition-[width]"
                      style={{ width: `${Math.round(uploadProgress.fraction * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {pendingAttachments.length > 0 && (
                <div className="mx-auto mb-3 flex max-w-2xl flex-col gap-2">
                  {pendingAttachments.map((attachment, index) => (
                    <PendingAttachmentPreview
                      key={`${attachment.file.name}-${attachment.file.size}-${index}`}
                      file={attachment.file}
                      previewUrl={attachment.previewUrl}
                      durationSeconds={attachment.voiceDuration}
                      onRemove={() => removePendingAttachment(index)}
                    />
                  ))}
                </div>
              )}
              <div className="mx-auto flex max-w-2xl items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="sr-only"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || isVoiceRecording || preparingAttachment || uploadProgress !== null}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/50 transition hover:bg-white/8 hover:text-white disabled:opacity-40"
                  aria-label="Attach file"
                  title="Attach file"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={sending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/50 transition hover:bg-white/8 hover:text-white disabled:opacity-40"
                  aria-label="Record voice message"
                  title="Record voice message"
                >
                  <Mic className="h-5 w-5" />
                </button>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (sendError) setSendError("");
                  }}
                  onKeyDown={handleTextareaKeyDown}
                  onPaste={handleTextareaPaste}
                  rows={1}
                  placeholder={
                    composeDragOver
                      ? "Drop to attach…"
                      : "Write a message…"
                  }
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                />
                <button
                  type="submit"
                  disabled={(!draft.trim() && pendingAttachments.length === 0) || sending || preparingAttachment || uploadProgress !== null}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                    (draft.trim() || pendingAttachments.length > 0) && !sending && !preparingAttachment && uploadProgress === null
                      ? "bg-white text-black shadow-md shadow-black/20 hover:bg-white/90"
                      : "bg-white/[0.08] text-white/30"
                  } disabled:cursor-not-allowed`}
                  aria-label="Send message"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-5 w-5 stroke-[2.5]" />
                  )}
                </button>
              </div>
                </>
              )}
            </form>
          </>
        )}
      </section>

      {/* New message modal */}
      {showNewMessage && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center">
          <div
            className="absolute inset-0"
            onClick={() => !newMessageSubmitting && setShowNewMessage(false)}
            aria-hidden
          />
          <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-[#161618] p-6 ring-1 ring-white/10 shadow-2xl">
            <h3 className="text-lg font-semibold">New conversation</h3>
            <p className="mt-1 text-sm text-white/50">
              Message someone directly or start a group.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setNewMessageMode("direct")}
                className={`rounded-xl py-2 text-sm font-medium transition ${
                  newMessageMode === "direct"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Direct
              </button>
              <button
                type="button"
                onClick={() => setNewMessageMode("group")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition ${
                  newMessageMode === "group"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Users className="h-4 w-4" />
                Group
              </button>
            </div>

            <form onSubmit={handleNewMessage} className="mt-5 space-y-4">
              {newMessageMode === "direct" ? (
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
              ) : (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                      Group name
                    </span>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
                      placeholder="Weekend crew"
                      required
                      autoFocus
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                      Members
                    </span>
                    <input
                      type="text"
                      value={newGroupMembers}
                      onChange={(e) => setNewGroupMembers(e.target.value)}
                      autoCapitalize="none"
                      spellCheck={false}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
                      placeholder="alice, bob, charlie"
                      required
                    />
                    <p className="mt-1.5 text-xs text-white/40">
                      Separate usernames with commas or spaces.
                    </p>
                  </label>
                </>
              )}

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
                  disabled={
                    newMessageSubmitting ||
                    (newMessageMode === "direct"
                      ? !newRecipient.trim()
                      : !newGroupName.trim() || !newGroupMembers.trim())
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                >
                  {newMessageSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfile && user && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!avatarUploading && !passwordSubmitting) {
                setShowProfile(false);
                resetPasswordForm();
              }
            }}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-3xl bg-[#161618] p-6 ring-1 ring-white/10 shadow-2xl">
            <h3 className="text-lg font-semibold">Your profile</h3>
            <p className="mt-1 text-sm text-white/50">@{user.username}</p>

            <div className="mt-6 flex flex-col items-center gap-4">
              <MessengerAvatar
                username={user.username}
                avatarUrl={user.avatarUrl}
                size="lg"
              />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                onChange={handleAvatarChange}
                className="sr-only"
              />
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  Change photo
                </button>
                {user.avatarUrl && (
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={handleRemoveAvatar}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
              {avatarError && (
                <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
                  {avatarError}
                </p>
              )}
            </div>

            <div className="mt-8 border-t border-white/8 pt-6">
              <h4 className="text-sm font-medium text-white/80">Change password</h4>
              <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
                <label className="block" htmlFor="message-current-password">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                    Current password
                  </span>
                  <input
                    id="message-current-password"
                    name="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
                    required
                  />
                </label>
                <label className="block" htmlFor="message-new-password">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                    New password
                  </span>
                  <input
                    id="message-new-password"
                    name="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
                    required
                  />
                </label>
                <label className="block" htmlFor="message-confirm-password">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                    Confirm new password
                  </span>
                  <input
                    id="message-confirm-password"
                    name="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10"
                    required
                  />
                </label>
                {passwordError && (
                  <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
                    {passwordError}
                  </p>
                )}
                {passwordSuccess && (
                  <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/20">
                    {passwordSuccess}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={passwordSubmitting || avatarUploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
                >
                  {passwordSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Update password
                </button>
              </form>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowProfile(false);
                resetPasswordForm();
              }}
              disabled={avatarUploading || passwordSubmitting}
              className="mt-6 w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {mediaViewer && (
        <MediaViewer item={mediaViewer} onClose={() => setMediaViewer(null)} />
      )}
    </div>
  );
}
