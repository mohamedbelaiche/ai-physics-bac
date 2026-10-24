import { retrieveRelevantChunks } from "@/lib/knowledge/retrieval";
import { sourceLabel, type KnowledgeChunk } from "@/lib/knowledge";
import { buildSystemPrompt } from "@/lib/persona";

/**
 * طبقة بناء الطلب: تنقية التاريخ، اختيار السياق، تجهيز الرسائل.
 */

export const MAX_HISTORY_MESSAGES = 10;
export const MAX_MESSAGE_CHARS = 4000;
export const MAX_MESSAGES_IN_PAYLOAD = 21;
export const MAX_REQUEST_BYTES = 40_000;
export const REQUEST_TIMEOUT_MS = 120_000;

export const ALLOWED_ROLES = ["user", "assistant"] as const;
export type ChatRole = (typeof ALLOWED_ROLES)[number];

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export function assertString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value;
}

export function incomingToChatMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0 || raw.length > MAX_MESSAGES_IN_PAYLOAD) return null;
  const messages: ChatMessage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const obj = item as Record<string, unknown>;
    const role = obj.role;
    const content = obj.content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    if (content.length > MAX_MESSAGE_CHARS) return null;
    if (content.trim().length === 0) return null;
    messages.push({ role, content });
  }
  return messages;
}

export function truncateHistory(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_HISTORY_MESSAGES) return messages;
  return messages.slice(-MAX_HISTORY_MESSAGES);
}

export function lastUserQuestion(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}

export type SourceRef = {
  ref: string;
  title: string;
  unit: string;
  source: string;
};

export function refsFromChunks(chunks: KnowledgeChunk[]): SourceRef[] {
  return chunks.map((chunk, i) => ({
    ref: `S${i + 1}`,
    title: chunk.title,
    unit: chunk.unit,
    source: sourceLabel(chunk.source),
  }));
}

export function buildRequestMessages(messages: ChatMessage[]) {
  const truncated = truncateHistory(messages);
  const question = lastUserQuestion(truncated);
  const retrieved = retrieveRelevantChunks(question);
  const selectedChunks = retrieved.map((r) => r.chunk);
  const system = buildSystemPrompt(selectedChunks);
  const refs = refsFromChunks(selectedChunks);
  return {
    system,
    refs,
    coreMessages: truncated.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
  };
}
