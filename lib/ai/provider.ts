import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * طبقة المزوّد: OpenCode Zen (متوافق مع OpenAI Chat Completions).
 * حول نقطة النهاية: https://opencode.ai/zen/v1/chat/completions
 * والتوثيق: https://opencode.ai/docs/zen/
 * المفاتيح تبقى على السيرفر فقط، وهي غير مطبوعة في أي سجل.
 */

export type ProviderConfig = {
  baseURL: string;
  apiKey: string;
  model: string;
};

export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigError";
  }
}

export const DEFAULT_BASE_URL = "https://opencode.ai/zen/v1";
export const DEFAULT_MODEL = "glm-5.3-flash";

function normalizeBaseURL(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "");
  if (url.endsWith("/chat/completions")) {
    url = url.slice(0, -"/chat/completions".length);
  }
  return url;
}

export function readProviderConfig(): ProviderConfig {
  const apiKey = process.env.AI_API_KEY?.trim();
  const rawBaseURL = process.env.AI_BASE_URL?.trim();
  const model = process.env.AI_MODEL?.trim();

  if (!apiKey) {
    throw new ProviderConfigError(
      "المزوّد غير مهيّأ: أضف مفتاح API في المتغيّر AI_API_KEY. تطويراً: ملف .env.local، وإنتاجاً: إعدادات Vercel.",
    );
  }
  return {
    baseURL: rawBaseURL ? normalizeBaseURL(rawBaseURL) : DEFAULT_BASE_URL,
    apiKey,
    model: model || DEFAULT_MODEL,
  };
}

export type ChatModel = ReturnType<typeof buildChatModel>;

export function buildChatModel(config: ProviderConfig) {
  const provider = createOpenAICompatible({
    name: "opencode-zen",
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
  return provider.chatModel(config.model);
}
