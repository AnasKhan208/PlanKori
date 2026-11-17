import { GoogleGenAI } from "@google/genai";
import { serverConfig, AI_MODE } from "../config.ts";

export interface EmbeddingResult {
  embedding: number[];
  source: "live" | "demo";
}

export interface VendorEmbeddingInput {
  business_name: string;
  category: string;
  description: string | null;
  tags?: string[] | null;
  themes?: string[] | null;
  dietary_options?: string[] | null;
  location_city: string;
}

// 768-dimension configuration
export const EMBEDDING_DIM = 768;

// Common stop words to omit during tokenization in demo mode
const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "arent", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
  "but", "by", "can", "cannot", "could", "did", "do", "does", "doing", "down", "during", "each",
  "few", "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers",
  "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself",
  "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only",
  "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
  "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
  "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until",
  "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
  "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
]);

/**
 * 32-bit FNV-1a deterministic hash
 */
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * L2 normalization of an array of numbers
 */
export function l2Normalize(vec: number[] | Float64Array): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) {
    const res = new Array(vec.length).fill(0);
    res[0] = 1.0;
    return res;
  }
  const result = new Array(vec.length);
  for (let i = 0; i < vec.length; i++) {
    result[i] = Number((vec[i] / norm).toFixed(7));
  }
  return result;
}

/**
 * Deterministic hashed bag-of-words 768-d embedding for demo mode
 */
export function generateDemoEmbedding(text: string): number[] {
  const vec = new Float64Array(EMBEDDING_DIM);
  const rawTokens = text.toLowerCase().match(/\b[a-z0-9_'-]+\b/g) || [];
  const tokens = rawTokens.filter((t) => t.length > 1 && !STOPWORDS.has(t));

  if (tokens.length === 0) {
    // If text contains no substantive tokens, hash raw characters as fallback
    for (let i = 0; i < text.length; i++) {
      const bucket = (text.charCodeAt(i) * 31 + i) % EMBEDDING_DIM;
      vec[bucket] += 1.0;
    }
  } else {
    for (const token of tokens) {
      const bucket = fnv1a(token) % EMBEDDING_DIM;
      const sign = (fnv1a(token + "_sign") & 1) === 1 ? 1.0 : -1.0;
      vec[bucket] += sign;
    }
  }

  return l2Normalize(vec);
}

/**
 * Generate embedding for a raw text string.
 * Supports live Gemini API with outputDimensionality 768 and fallback to deterministic demo embeddings.
 */
export async function embedText(text: string): Promise<EmbeddingResult> {
  const cleanText = text.trim();
  if (!cleanText) {
    return {
      embedding: generateDemoEmbedding("general"),
      source: "demo",
    };
  }

  if (AI_MODE === "live") {
    const apiKey = serverConfig.geminiApiKey();
    if (!apiKey) {
      console.warn("[Embeddings] AI_MODE=live but GEMINI_API_KEY is not set. Falling back to demo embeddings.");
      return {
        embedding: generateDemoEmbedding(cleanText),
        source: "demo",
      };
    }

    // Try with 1 retry
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.embedContent({
          model: serverConfig.geminiEmbeddingModel,
          contents: cleanText,
          config: {
            outputDimensionality: EMBEDDING_DIM,
          },
        });

        const rawValues = response.embeddings?.[0]?.values;

        if (rawValues && rawValues.length > 0) {
          const normalized = l2Normalize(rawValues.slice(0, EMBEDDING_DIM));
          return {
            embedding: normalized,
            source: "live",
          };
        }

        throw new Error("No embedding values received in Gemini response");
      } catch (err) {
        console.warn(`[Embeddings] Gemini API attempt ${attempt} failed:`, err);
        if (attempt === 1) {
          // Wait 500ms before retrying once
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    console.error("[Embeddings] All Gemini live embedding attempts failed. Falling back gracefully to demo embedding.");
    return {
      embedding: generateDemoEmbedding(cleanText),
      source: "demo",
    };
  }

  // Demo mode
  return {
    embedding: generateDemoEmbedding(cleanText),
    source: "demo",
  };
}

/**
 * Produce standard vendor representation string and compute embedding.
 * Representation = business_name + category + description + tags + themes + dietary_options + city
 */
export async function embedVendor(vendor: VendorEmbeddingInput): Promise<EmbeddingResult> {
  const parts = [
    vendor.business_name,
    vendor.category,
    vendor.description || "",
    (vendor.tags || []).join(" "),
    (vendor.themes || []).join(" "),
    (vendor.dietary_options || []).join(" "),
    vendor.location_city,
  ].filter((p) => p.trim().length > 0);

  const textToEmbed = parts.join(" ");
  return embedText(textToEmbed);
}
