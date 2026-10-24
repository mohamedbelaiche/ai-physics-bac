"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@/components/icons";
import type { Conversation } from "@/components/types";

type SidebarProps = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
};

export function SidebarContent({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function startEdit(conversation: Conversation) {
    setEditingId(conversation.id);
    setDraft(conversation.title);
  }

  function commitEdit() {
    if (editingId) {
      const title = draft.trim();
      if (title) onRename(editingId, title);
      setEditingId(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="surface b-line border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="brand-badge inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold shadow-sm">
            ع
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">عقل ثاني</p>
            <p className="t-muted text-[11px]">فيزياء البكالوريا — المدرّس الذكي</p>
          </div>
        </div>
        <button onClick={onNew} type="button" className="btn btn-primary mt-4 w-full rounded-xl px-3 py-2.5">
          <IconPlus />
          <span>محادثة جديدة</span>
        </button>
        <div className="input-base mt-3 flex items-center gap-2 rounded-xl px-3 py-2" dir="rtl">
          <IconSearch className="t-muted h-4 w-4 shrink-0" />
          <input
            type="text"
            dir="rtl"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="بحث في المحادثات…"
            aria-label="بحث في المحادثات"
            className="t-muted placeholder:text-[color:var(--muted)] w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <nav aria-label="سجل المحادثات" className="nice-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {filtered.length === 0 ? (
          <p className="t-muted px-3 py-6 text-center text-xs">
            {conversations.length === 0
              ? "لا توجد محادثات بعد؛ ابدأ من زر محادثة جديدة."
              : "لا نتائج مطابقة للبحث."}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {filtered.map((conversation) => {
              const active = conversation.id === activeId;
              return (
                <li key={conversation.id}>
                  {editingId === conversation.id ? (
                    <div className="rounded-xl px-2 py-1">
                      <input
                        ref={inputRef}
                        type="text"
                        dir="rtl"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitEdit();
                          } else if (event.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        onBlur={commitEdit}
                        maxLength={80}
                        aria-label="اسم المحادثة الجديد"
                        className="input-base w-full rounded-lg px-2 py-1.5 text-sm outline-none"
                      />
                    </div>
                  ) : (
                    <div
                      className={`group flex items-center gap-1 rounded-xl px-2 py-1 text-sm ${
                        active
                          ? "surface-2 t-accent font-semibold"
                          : "hover:bg-[color:var(--panel-2)]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(conversation.id)}
                        className="min-w-0 flex-1 truncate rounded-lg px-2 py-2 text-start"
                        aria-current={active ? "page" : undefined}
                      >
                        {conversation.title || "بدون عنوان"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(conversation)}
                        className="btn h-8 w-8 rounded-lg p-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label={`إعادة تسمية: ${conversation.title}`}
                        title="إعادة تسمية"
                      >
                        <IconPencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(conversation.id)}
                        className="btn h-8 w-8 rounded-lg p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-[color:var(--danger)]"
                        aria-label={`حذف المحادثة: ${conversation.title}`}
                        title="حذف المحادثة"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="surface b-line border-t px-4 py-3">
        <p className="t-muted text-[11px] leading-relaxed">
          وضع الزائر: المحادثات مخزّنة في متصفحك فقط، ولا يرسل للسيرفر إلا نص رسائلك عند الإرسال.
        </p>
      </div>
    </div>
  );
}
