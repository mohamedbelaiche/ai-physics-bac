"use client";

import { useCallback, useState } from "react";
import type { Message } from "ai";
import { MarkdownContent } from "@/components/MarkdownContent";
import { IconCheck, IconCopy, IconRefresh } from "@/components/icons";
import type { SourceRef } from "@/components/types";

type Props = {
  message: Message;
  isLast: boolean;
  streamingActive: boolean;
  sources?: SourceRef[];
  canRegenerate: boolean;
  onRegenerate: () => void;
};

function Timestamp({ ms }: { ms?: number }) {
  if (!ms) return null;
  const date = new Date(ms);
  const time = `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  return <time className="t-muted text-[11px]">{time}</time>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* تجاهل منع النسخ في متصفحات قديمة */
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      className="btn btn-ghost h-8 px-2 text-xs"
      aria-label="نسخ نص الرسالة"
      title={copied ? "تم النسخ" : "نسخ الرد"}
    >
      {copied ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
      <span aria-hidden="true">{copied ? "نُسخ" : "نسخ"}</span>
    </button>
  );
}

function SourceChips({ sources }: { sources: SourceRef[] }) {
  if (!sources.length) return null;
  return (
    <div className="result-box rounded-xl p-3">
      <p className="t-muted mb-2 text-xs font-semibold">المصادر من ملفات المشروع</p>
      <ul className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <li
            key={s.ref}
            className="chip rounded-lg px-2.5 py-1 text-[11px]"
            title={`${s.title} — ${s.source}`}
          >
            <span className="t-accent font-semibold">[{s.ref}]</span> {s.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MessageItem({
  message,
  isLast,
  streamingActive,
  sources,
  canRegenerate,
  onRegenerate,
}: Props) {
  const isUser = message.role === "user";
  const content = typeof message.content === "string" ? message.content : "";
  const emptyStream = isLast && streamingActive && content.length === 0;

  if (isUser) {
    return (
      <div className="flex justify-start">
        <div className="user-bubble max-w-[85%] rounded-2xl px-4 py-2.5 md:max-w-[70%]">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed" dir="auto">
            {content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="brand-badge inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold">
          ع
        </span>
        <span className="text-xs font-semibold">عقل ثاني</span>
        <Timestamp ms={message.createdAt as unknown as number | undefined} />
      </div>

      <div className="flex-1">
        {emptyStream ? (
          <span className="inline-flex items-center gap-1 py-2" role="status" aria-label="النموذج يكتب الآن">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
        ) : (
          <MarkdownContent content={content} />
        )}

        {isLast && sources && !emptyStream ? <SourceChips sources={sources} /> : null}
      </div>

      {!emptyStream && !streamingActive ? (
        <div className="flex items-center gap-2">
          <CopyButton text={content} />
          {isLast && canRegenerate ? (
            <button
              type="button"
              onClick={onRegenerate}
              className="btn btn-ghost h-8 px-2 text-xs"
              aria-label="إعادة توليد الرد"
              title="إعادة توليد"
            >
              <IconRefresh className="h-3.5 w-3.5" />
              <span aria-hidden="true">إعادة توليد</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
