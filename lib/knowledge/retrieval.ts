import { KNOWLEDGE_CHUNKS, type KnowledgeChunk } from "@/lib/knowledge";

/**
 * محرك استرجاع خفيف (RAG-lite) يعمل بدون مكتبات خارجية:
 * تطبيع عربي + تجزئة + ترجيح TF-IDF مع رفع ثقل محاولة العنوان والوسوم.
 */

const STOPWORDS = new Set<string>([
  "في", "من", "على", "عن", "الي", "إلى", "ما", "هو", "هي", "هل", "كيف", "لماذا",
  "اين", "أين", "مع", "ان", "أن", "ثم", "كل", "قد", "لا", "ليس", "هذا", "هذه",
  "ذلك", "التي", "الذي", "ماذا", "اشرح", "اعرني", "عرّف", "احسب", "حل", "عندي",
  "ولي", "وما", "بما", "كان", "يكون", "جيدا", "بين", "بعد", "قبل", "لكن", "او",
  "أو", "و", "ب", "ل", "راجع", "افحص", "اختبار", "اخبرني", "السلام",
]);

export function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0626/g, "\u064A")
    .replace(/\u0624/g, "\u0648");
}

const TOKEN_RE = /[^\p{L}\p{N}]+/u;

export function tokenize(text: string): string[] {
  const normalized = normalizeArabic(text);
  return normalized
    .split(TOKEN_RE)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

type DocIndex = {
  chunk: KnowledgeChunk;
  tf: Map<string, number>;
  length: number;
};

let docIndex: DocIndex[] | null = null;

function buildIndex(): DocIndex[] {
  if (docIndex) return docIndex;
  docIndex = KNOWLEDGE_CHUNKS.map((chunk) => {
    const tokens = [
      ...tokenize(chunk.text),
      ...tokenize(chunk.title),
      ...tokenize(chunk.title),
      ...tokenize(chunk.tags.join(" ")),
      ...tokenize(chunk.tags.join(" ")),
      ...tokenize(chunk.unit),
      ...tokenize(chunk.unit),
    ];
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { chunk, tf, length: tokens.length };
  });
  return docIndex;
}

const DOC_FIELDS3: KnowledgeChunk[] = KNOWLEDGE_CHUNKS;

export type RetrievedChunk = {
  chunk: KnowledgeChunk;
  score: number;
};

const TOP_K = 4;
const MIN_SCORE = 0.12;

export function retrieveRelevantChunks(query: string): RetrievedChunk[] {
  const index = buildIndex();
  const queryTokens = Array.from(new Set(tokenize(query)));
  if (queryTokens.length === 0) return [];

  const df = new Map<string, number>();
  for (const doc of index) {
    for (const token of queryTokens) {
      if (doc.tf.has(token)) df.set(token, (df.get(token) ?? 0) + 1);
    }
  }
  const n = index.length;
  const scored: RetrievedChunk[] = [];
  for (const doc of index) {
    let score = 0;
    for (const token of queryTokens) {
      const dft = df.get(token) ?? 0;
      if (dft === 0) continue;
      const idf = Math.log(1 + n / (dft + 0.5));
      const tf = doc.tf.get(token) ?? 0;
      if (tf === 0) continue;
      const norm = 1 + Math.log(tf);
      score += idf * norm;
    }
    score = score / Math.sqrt(doc.length) * 3;
    if (score >= MIN_SCORE) {
      scored.push({ chunk: doc.chunk, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, TOP_K);
}

export const ALL_CHUNKS: KnowledgeChunk[] = DOC_FIELDS3;
