"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconSend, IconStop } from "@/components/icons";

type ChatInputProps = {
  busy: boolean;
  onSend: (content: string) => void;
  onStop: () => void;
};

const MAX_CHARS = 4000;

export function ChatInput({ busy, onSend, onStop }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 176)}px`;
  }, [value]);

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  const send = useCallback(() => {
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue("");
  }, [value, busy, onSend]);

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter") return;
    const native = event.nativeEvent as KeyboardEvent & { isComposing?: boolean };
    if (native.isComposing) return;
    if (event.shiftKey) return;
    event.preventDefault();
    send();
  }

  return (
    <div className="b-line rounded-2xl border p-2 shadow-sm surface">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, MAX_CHARS))}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={MAX_CHARS}
          dir="auto"
          disabled={false}
          placeholder={busy ? "النموذج يكتب الآن… (يمكنك الإيقاف)" : "اكتب سؤالك هنا… (Enter للإرسال، Shift+Enter لسطر جديد)"}
          aria-label="مربع كتابة السؤال"
          className="input-base nice-scroll max-h-44 min-h-[40px] w-full flex-1 resize-none rounded-xl px-3 py-2.5 text-[15px] leading-relaxed placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        />
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="btn btn-ghost h-10 px-3.5"
            aria-label="إيقاف التوليد"
            title="إيقاف التوليد"
          >
            <IconStop className="h-4 w-4" />
            <span className="text-xs">إيقاف</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={value.trim().length === 0}
            className="btn btn-primary h-10 px-3.5 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="إرسال الرسالة"
            title="إرسال"
          >
            <IconSend className="h-4 w-4" />
            <span className="text-xs">إرسال</span>
          </button>
        )}
      </div>
      <div className="t-muted mt-1 flex items-center justify-between px-1 text-[10px]">
        <span dir="ltr">{value.length} / 4000</span>
        <span>الإجابات بمعادلات KaTeX</span>
      </div>
    </div>
  );
}
