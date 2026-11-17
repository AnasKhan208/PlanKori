import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { embedVendor } from "../src/lib/ai/embeddings.ts";
import type { Database } from "../src/types/db.ts";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const k = trimmed.substring(0, eq).trim();
          const v = trimmed.substring(eq + 1).trim();
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
      break;
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey || supabaseServiceKey === "dummy-service-role-key") {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required to re-embed vendors.");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function reembed() {
  console.log("🔄 Starting Re-embedding of all Vendors...");
  console.log(`🤖 Current AI_MODE: ${process.env.AI_MODE || "demo"}`);

  const { data: vendors, error } = await supabase
    .from("vendors")
    .select("id, business_name, category, description, tags, themes, dietary_options, location_city");

  if (error || !vendors) {
    console.error("Failed to fetch vendors:", error?.message);
    process.exit(1);
  }

  console.log(`Found ${vendors.length} vendors in database to re-embed.`);

  let updated = 0;
  for (let i = 0; i < vendors.length; i++) {
    const v = vendors[i];
    process.stdout.write(`  [${i + 1}/${vendors.length}] Re-embedding "${v.business_name}"... `);

    const { embedding, source } = await embedVendor({
      business_name: v.business_name,
      category: v.category,
      description: v.description,
      tags: v.tags,
      themes: v.themes,
      dietary_options: v.dietary_options,
      location_city: v.location_city,
    });

    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        embedding: `[${embedding.join(",")}]`,
        embedding_source: source,
        updated_at: new Date().toISOString(),
      })
      .eq("id", v.id);

    if (updateError) {
      console.log(`❌ Error: ${updateError.message}`);
    } else {
      console.log(`✓ (${source})`);
      updated++;
    }

    if (source === "live") {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log(`\n🎉 Re-embedding finished! Updated ${updated} of ${vendors.length} vendors.`);
}

reembed().catch((err) => {
  console.error("Re-embed error:", err);
  process.exit(1);
});
