/**
 * Application Configuration & Environment Variables
 * Single source of configuration following docs/SPEC.md.
 * 
 * Server-only secrets are guarded so they cannot be accessed or bundled into client code.
 */

// Public / Client-accessible configuration
export const publicConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;

// Server-only configuration & business constants
function getServerSecret(key: string, fallback?: string): string {
  if (typeof window !== "undefined") {
    throw new Error(`Attempted to access server-only environment variable "${key}" on the client.`);
  }
  const val = process.env[key] || fallback;
  if (!val) {
    return "";
  }
  return val;
}

export const serverConfig = {
  // Database & Supabase Secrets
  supabaseServiceRoleKey: () => getServerSecret("SUPABASE_SERVICE_ROLE_KEY", "dummy-service-role-key"),

  // AI Configuration
  aiMode: (process.env.AI_MODE as "live" | "demo") || "demo",
  geminiApiKey: () => getServerSecret("GEMINI_API_KEY", ""),
  geminiChatModel: process.env.GEMINI_CHAT_MODEL || "gemini-1.5-pro",
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-generate-002",
  embeddingDim: 768,

  // Payment Configuration
  paymentProvider: (process.env.PAYMENT_PROVIDER as "mock" | "sslcommerz") || "mock",
  sslcommerzStoreId: () => getServerSecret("SSLCOMMERZ_STORE_ID", ""),
  sslcommerzStorePassword: () => getServerSecret("SSLCOMMERZ_STORE_PASSWORD", ""),
  sslcommerzIsLive: process.env.SSLCOMMERZ_IS_LIVE === "true",

  // Business Rules & Constants (from docs/SPEC.md)
  currency: "BDT" as const,
  usdToBdtRate: Number(process.env.USD_TO_BDT_RATE) || 120,
  budgetCapPercent: Number(process.env.BUDGET_CAP_PERCENT) || 105,
  depositPercent: Number(process.env.DEPOSIT_PERCENT) || 20,
  platformCommissionPercent: Number(process.env.PLATFORM_COMMISSION_PERCENT) || 8,
  newVendorDays: Number(process.env.NEW_VENDOR_DAYS) || 60,
};

export const AI_MODE = serverConfig.aiMode;
