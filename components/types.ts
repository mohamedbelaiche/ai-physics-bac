import type { Message } from "ai";

export type { Message };

export type ChatRole = "user" | "assistant";

export type StoredMessage = {
  role: ChatRole;
  content: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type SourceRef = {
  ref: string;
  title: string;
  unit: string;
  source: string;
};

export type Store = {
  conversations: Conversation[];
  messages: Record<string, StoredMessage[]>;
};
