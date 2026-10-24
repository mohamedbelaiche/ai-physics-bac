/**
 * محدّد معدل بسيط (sliding window) في ذاكرة العملية.
 * تنبيه: على بيئة Serverless (Vercel) الذاكرة ليست مشتركة بين النسخ،
 * فالحدّ هنا تقريبي بحماية إضافية وليس نظام عدّ دقيق.
 * لحدّ دقّي في الإنتاج: Upstash Redis أو قاعدة بيانات.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const prev = hits.get(key) ?? [];
  const recent = prev.filter((t) => t > windowStart);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= windowStart)) hits.delete(k);
      if (hits.size <= 2500) break;
    }
  }
  return false;
}

export function clientKeyFromRequest(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "local-dev";
}
