"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import type { Message } from "ai";
import { MessageItem } from "@/components/MessageItem";
import { ChatInput } from "@/components/ChatInput";
import { IconPlus, IconSend } from "@/components/icons";
import type { Conversation, SourceRef, StoredMessage } from "@/components/types";

type ChatWindowProps = {
  conversation: Conversation;
  initialMessages: Message[];
  onSaveMessages: (conversationId: string, messages: StoredMessage[]) => void;
  mobileOpenSidebar: () => void;
  onNewChat: () => void;
};

const SUGGESTIONS = [
  "اشرح لي درسًا في الفيزياء",
  "حل تمرينًا خطوة بخطوة",
  "ساعدني على فهم قانون فيزيائي",
  "اختبر فهمي لوحدة معينة",
  "راجع معي أهم أفكار البكالوريا",
];

function extractSources(data: unknown[] | undefined): SourceRef[] {
  if (!data || data.length === 0) return [];
  for (let i = data.length - 1; i >= 0; i--) {
    const part = data[i] as { sources?: SourceRef[] } | null;
    if (part && typeof part === "object" && Array.isArray(part.sources)) {
      return part.sources.filter(
        (s): s is SourceRef =>
          typeof s?.ref === "string" &&
          typeof s?.title === "string" &&
          typeof s?.unit === "string" &&
          typeof s?.source === "string",
      );
    }
  }
  return [];
}

export function ChatWindow({
  conversation,
  initialMessages,
  onSaveMessages,
  mobileOpenSidebar,
  onNewChat,
}: ChatWindowProps) {
  const chat = useChat({
    api: "/api/chat",
    id: conversation.id,
    initialMessages,
  });

  const {
    messages,
    data,
    status,
    append,
    reload,
    stop,
    error,
  } = chat;

  const streaming = status === "submitted" || status === "streaming";

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stickToBottom = useRef(true);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    if (messages.length === 0) return;
    saveTimer.current = window.setTimeout(() => {
      const stored: StoredMessage[] = messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: typeof m.content === "string" ? m.content : "",
      }));
      onSaveMessages(conversation.id, stored);
    }, 350);
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  }, [messages, conversation.id, onSaveMessages]);

  useEffect(() => {
    if (!stickToBottom.current) return;
    const el = viewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => {
    const el = viewportRef.current;
    if (el) {
      stickToBottom.current = true;
      el.scrollTop = el.scrollHeight;
    }
  }, [conversation.id]);

  const onViewportScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 90;
  }, []);

  const sources = extractSources(data);
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  })();

  const sendMessage = useCallback(
    (content: string) => {
      stickToBottom.current = true;
      void append({ role: "user", content });
    },
    [append],
  );

  const empty = messages.length === 0;

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <header className="surface b-line flex items-center gap-3 border-b px-4 py-3 md:hidden">
        <button
          type="button"
          className="btn btn-ghost h-9 w-9 p-0"
          onClick={mobileOpenSidebar}
          aria-label="فتح قائمة المحادثات"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{conversation.title}</p>
        <button
          type="button"
          className="btn btn-ghost h-9 w-9 p-0"
          onClick={onNewChat}
          aria-label="محادثة جديدة"
          title="محادثة جديدة"
        >
          <IconPlus />
        </button>
      </header>

      <div
        ref={viewportRef}
        onScroll={onViewportScroll}
        className="nice-scroll flex-1 overflow-y-auto px-4 py-6 md:px-8"
        role="log"
        aria-live="polite"
      >
        <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-6">
          {empty ? (
            <WelcomeScreen onPick={sendMessage} />
          ) : (
            messages.map((message, index) => {
              const isLast = index === messages.length - 1;
              const isLastAssistant = isLast && message.role === "assistant";
              return (
                <MessageItem
                  key={message.id ?? `${conversation.id}-${index}`}
                  message={message}
                  isLast={isLast}
                  streamingActive={Boolean(streaming) && isLast}
                  sources={isLastAssistant ? sources : undefined}
                  canRegenerate={!streaming && lastAssistantIndex === index}
                  onRegenerate={() => reload()}
                />
              );
            })
          )}

          {error ? (
            <div className="alert rounded-xl px-4 py-3 text-sm" role="alert">
              {error.message || "تعذّر إرسال الطلب. أعد المحاولة."}
              {!streaming && messages.length > 0 ? (
                <button type="button" onClick={() => reload()} className="btn btn-ghost ms-2 h-7 px-2 text-xs">
                  إعادة المحاولة
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="surface b-line border-t px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3 md:px-8">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            busy={Boolean(streaming)}
            onSend={sendMessage}
            onStop={stop}
          />
          <p className="t-muted mt-2 text-center text-[11px]">
            قد يخطئ الذكاء الاصطناعي؛ تحقق من النتائج في دفترك ولا تعتمد عليها وحدها.
          </p>
        </div>
      </div>
    </section>
  );
}

function WelcomeScreen({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
      <span className="brand-badge inline-flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold shadow-sm">
        ع
      </span>
      <div>
        <h1 className="text-2xl font-bold">عقل ثاني</h1>
        <p className="t-muted mt-1 text-sm">
          أنا المدرّس الذكي للفيزياء، متخصص في علوم الفيزياء للبكالوريا الجزائرية.
        </p>
        <p className="t-muted mt-1 text-sm">
          اسأل أو اختر بداية جاهزة أدناه، وسأشرح لك الدرس أو أحلّ التمرين خطوة بخطوة.
        </p>
      </div>
      <ul className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((prompt) => (
          <li key={prompt} className={prompt === SUGGESTIONS[0] ? "sm:col-span-2" : undefined}>
            <button
              type="button"
              onClick={() => onPick(prompt)}
              className="btn surface-2 b-line h-auto w-full items-start rounded-xl border px-4 py-3 text-start text-sm font-medium hover:brightness-[0.98]"
            >
              <IconSend className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{prompt}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
