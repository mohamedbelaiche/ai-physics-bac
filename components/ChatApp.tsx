"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { SidebarContent } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconClose, IconPlus } from "@/components/icons";
import type { Conversation, Message, Store, StoredMessage } from "@/components/types";

const STORE_KEY = "aqel-thani-store-v1";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { conversations: [], messages: {} };
    const parsed = JSON.parse(raw) as Partial<Store>;
    const conversations = Array.isArray(parsed.conversations)
      ? parsed.conversations.filter(
          (c): c is Conversation =>
            typeof c?.id === "string" &&
            typeof c?.title === "string" &&
            typeof c?.createdAt === "number" &&
            typeof c?.updatedAt === "number",
        )
      : [];
    const messages: Record<string, StoredMessage[]> = {};
    if (parsed.messages && typeof parsed.messages === "object") {
      for (const [key, value] of Object.entries(parsed.messages)) {
        if (!Array.isArray(value)) continue;
        const clean = value
          .filter(
            (m): m is StoredMessage =>
              typeof m?.role === "string" &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m?.content === "string",
          )
          .map((m) => ({ role: m.role, content: m.content }));
        if (clean.length > 0) messages[key] = clean;
      }
    }
    return { conversations, messages };
  } catch {
    return { conversations: [], messages: {} };
  }
}

export function ChatApp() {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<Store>({ conversations: [], messages: {} });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    const loaded = loadStore();
    if (loaded.conversations.length === 0) {
      const now = Date.now();
      const first: Conversation = {
        id: newId(),
        title: "محادثة جديدة",
        createdAt: now,
        updatedAt: now,
      };
      setStore({ conversations: [first], messages: loaded.messages });
      setActiveId(first.id);
    } else {
      setStore(loaded);
      setActiveId(loaded.conversations[0].id);
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: Store) => {
    setStore(next);
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* ملء الحصة لا يوقف التطبيق */
      }
    }, 250);
  }, []);

  const activeConversation = store.conversations.find((c) => c.id === activeId) ?? store.conversations[0] ?? null;

  const handleNew = useCallback(() => {
    const now = Date.now();
    const conversation: Conversation = {
      id: newId(),
      title: "محادثة جديدة",
      createdAt: now,
      updatedAt: now,
    };
    persist({
      conversations: [conversation, ...store.conversations],
      messages: store.messages,
    });
    setActiveId(conversation.id);
    setDrawerOpen(false);
  }, [persist, store]);

  const handleSelect = useCallback(
    (id: string) => {
      setActiveId(id);
      setDrawerOpen(false);
    },
    [],
  );

  const handleRename = useCallback(
    (id: string, title: string) => {
      persist({
        ...store,
        conversations: store.conversations.map((c) =>
          c.id === id ? { ...c, title } : c,
        ),
      });
    },
    [persist, store],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm("هل تريد حذف هذه المحادثة نهائياً؟")) return;
      const nextConversations = store.conversations.filter((c) => c.id !== id);
      const nextMessages: Record<string, StoredMessage[]> = {};
      for (const [key, value] of Object.entries(store.messages)) {
        if (key !== id) nextMessages[key] = value;
      }
      const next: Store = { conversations: nextConversations, messages: nextMessages };
      if (nextConversations.length === 0) {
        const now = Date.now();
        const first: Conversation = {
          id: newId(),
          title: "محادثة جديدة",
          createdAt: now,
          updatedAt: now,
        };
        next.conversations = [first];
      }
      persist(next);
      setActiveId((current) => {
        if (current !== id) return current;
        return next.conversations[0].id;
      });
    },
    [persist, store],
  );

  const handleSaveMessages = useCallback(
    (conversationId: string, messages: StoredMessage[]) => {
      const now = Date.now();
      const titleSource = messages[0]?.role === "user" ? messages[0].content : null;
      const nextConversations = store.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const autoTitle =
          (c.title === "محادثة جديدة" || !c.title) && titleSource
            ? titleSource.slice(0, 40) + (titleSource.length > 40 ? "…" : "")
            : c.title;
        return { ...c, title: autoTitle, updatedAt: now };
      });
      persist({
        conversations: nextConversations.length > 0 ? nextConversations : store.conversations,
        messages: { ...store.messages, [conversationId]: messages },
      });
    },
    [persist, store],
  );

  if (!ready || !activeConversation) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="t-muted text-sm">جارٍ تحضير جلستك…</p>
      </main>
    );
  }

  const initialMessages: Message[] = (store.messages[activeConversation.id] ?? []).map(
    (m, i) => ({
      id: `${activeConversation.id}-seed-${i}`,
      role: m.role,
      content: m.content,
    }),
  );

  return (
    <main className="flex h-dvh overflow-hidden">
      {/* الدليل الجانبي على الشاشات الكبيرة */}
      <aside className="surface b-line hidden w-72 shrink-0 border-e md:flex md:flex-col">
        <SidebarContent
          conversations={store.conversations}
          activeId={activeConversation.id}
          onSelect={handleSelect}
          onNew={handleNew}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </aside>

      {/* منطقة المحادثة */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <ChatWindow
          key={activeConversation.id}
          conversation={activeConversation}
          initialMessages={initialMessages}
          onSaveMessages={handleSaveMessages}
          mobileOpenSidebar={() => setDrawerOpen(true)}
          onNewChat={handleNew}
        />
      </div>

      {/* الخاتمة المحمولة */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="قائمة المحادثات">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="surface absolute inset-y-0 start-0 flex w-[85vw] max-w-xs flex-col shadow-xl">
            <div className="b-line flex items-center justify-between border-b px-3 py-2">
              <p className="px-2 text-sm font-bold">المحادثات</p>
              <button
                type="button"
                className="btn btn-ghost h-8 w-8 p-0"
                onClick={() => setDrawerOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <IconClose />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <SidebarContent
                conversations={store.conversations}
                activeId={activeConversation.id}
                onSelect={handleSelect}
                onNew={handleNew}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            </div>
          </aside>
        </div>
      ) : null}

      {/* زر الموضوع ثابت أسفل الدليل الجانبي (على الحاسوب) وشريط الموبايل */}
      <div className="pointer-events-none fixed bottom-4 end-4 z-30 md:hidden">
        <div className="pointer-events-auto flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleNew}
            className="btn btn-primary h-10 w-10 rounded-full p-0 shadow-lg"
            aria-label="محادثة جديدة"
          >
            <IconPlus />
          </button>
        </div>
      </div>
      <div className="pointer-events-none fixed bottom-4 start-4 z-30 hidden md:block">
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>
    </main>
  );
}
