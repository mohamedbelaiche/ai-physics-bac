import { createDataStreamResponse, streamText } from "ai";
import { isRateLimited, clientKeyFromRequest } from "@/lib/rate-limit";
import {
  buildRequestMessages,
  incomingToChatMessages,
  REQUEST_TIMEOUT_MS,
} from "@/lib/ai/chat";
import { buildChatModel, ProviderConfigError, readProviderConfig } from "@/lib/ai/provider";

export const runtime = "edge";

const GENERIC_STREAM_ERROR = "تعذّر الاتصال بمزوّد الذكاء الاصطناعي. أعد المحاولة بعد قليل.";

function classifyProviderError(error: unknown): string {
  const raw = error instanceof Error ? `${error.message}` : String(error);
  const lowered = raw.toLowerCase();
  if (lowered.includes("401") || lowered.includes("unauthorized") || lowered.includes("api key")) {
    return "مفتاح API غير صالح أو منتهي الصلاحية. راجع إعداد AI_API_KEY.";
  }
  if (lowered.includes("429") || lowered.includes("rate")) {
    return "تجاوزت حد الاستخدام لدى المزوّد. انتظر قليلاً ثم أعد المحاولة.";
  }
  if (lowered.includes("timeout") || lowered.includes("aborted")) {
    return "انتهت مدة انتظار النموذج. أعد إرسال السؤال.";
  }
  return GENERIC_STREAM_ERROR;
}

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export async function POST(req: Request): Promise<Response> {
  const rateKey = clientKeyFromRequest(req.headers);
  if (isRateLimited(rateKey)) {
    return new Response(
      "عدد الطلبات مرتفع. انتظر دقيقة واحدة ثم أعد المحاولة.",
      { status: 429, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json(
      { error: "الطلب غير صالح. أعد إرسال الرسالة." },
      { status: 400, headers: JSON_HEADERS },
    );
  }
  if (typeof payload !== "object" || payload === null) {
    return Response.json(
      { error: "الطلب غير صالح. أعد إرسال الرسالة." },
      { status: 400, headers: JSON_HEADERS },
    );
  }
  const messages = incomingToChatMessages(
    (payload as Record<string, unknown>).messages,
  );
  if (!messages) {
    return Response.json(
      {
        error:
          "الرسائل غير مقبولة: تحقق من النص، وطوله الأقصى 4000 حرف، ولا يوجد سطر فارغ.",
      },
      { status: 400, headers: JSON_HEADERS },
    );
  }

  let config;
  try {
    config = readProviderConfig();
  } catch (error) {
    if (error instanceof ProviderConfigError) {
      return Response.json(
        { error: error.message },
        { status: 500, headers: JSON_HEADERS },
      );
    }
    return Response.json(
      { error: "خطأ داخلي في إعداد الخدمة." },
      { status: 500, headers: JSON_HEADERS },
    );
  }

  const { system, refs, coreMessages } = buildRequestMessages(messages);

  try {
    const result = streamText({
      model: buildChatModel(config),
      system,
      messages: coreMessages,
      temperature: 0.35,
      maxTokens: 2048,
      abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    return createDataStreamResponse({
      execute: (dataStream) => {
        dataStream.writeData({ type: "sources", refs });
        result.mergeIntoDataStream(dataStream, {
          sendReasoning: false,
          sendUsage: false,
        });
      },
      onError: (error) => {
        console.error("[chat] provider failed:", error instanceof Error ? error.name : "unknown");
        return classifyProviderError(error);
      },
    });
  } catch (error) {
    console.error("[chat] request failed:", error instanceof Error ? error.name : "unknown");
    return Response.json(
      { error: GENERIC_STREAM_ERROR },
      { status: 502, headers: JSON_HEADERS },
    );
  }
}

export function GET(): Response {
  return Response.json(
    { error: "الطريقة غير مسموحة على هذه النقطة. استخدم POST." },
    { status: 405, headers: JSON_HEADERS },
  );
}
