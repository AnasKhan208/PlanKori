import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { SEED_VENDORS } from "../data/vendors.seed.ts";
import { embedVendor } from "../src/lib/ai/embeddings.ts";
import type { Database } from "../src/types/db.ts";

// Load .env.local or .env if present
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

// Safety guard: refuse to run unless explicitly authorized
if (process.env.ALLOW_DEMO_SEED !== "true") {
  console.error("❌ Refusing to run seed: ALLOW_DEMO_SEED=true is required.");
  console.error("Usage: ALLOW_DEMO_SEED=true npm run seed:vendors");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey || supabaseServiceKey === "dummy-service-role-key") {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required to seed users and bypass RLS.");
  console.error("Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const VENDOR_NAMES = [
  "Prime Venues Ltd",
  "Heritage Halls Co",
  "Dhaka Gourmet Kitchen",
  "Chittagong Coastal Caterers",
  "Bengal Flora & Decors",
  "Urban Scenography Labs",
  "ProSound Arena Audio",
  "Lumiere Vision AV Tech",
  "CinemaCraft Photography",
  "Shutter Stories Studio",
  "Rhythm & Beats Entertainment",
  "Acoustic Harmony Collective",
];

async function seed() {
  console.log("🌱 Starting PlanKori Vendor Seeding...");
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  console.log(`🤖 AI_MODE: ${process.env.AI_MODE || "demo"}`);

  // 1. Ensure 12 Vendor Owner Accounts
  console.log("\n👤 Step 1: Ensuring 12 Vendor Accounts (vendor01..vendor12@plankori.test)...");
  const vendorOwners: { id: string; email: string }[] = [];

  // Fetch existing users first
  const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const existingUsersByEmail = new Map<string, string>();
  if (userList?.users) {
    for (const u of userList.users) {
      if (u.email) {
        existingUsersByEmail.set(u.email.toLowerCase(), u.id);
      }
    }
  }

  for (let i = 1; i <= 12; i++) {
    const pad = i.toString().padStart(2, "0");
    const email = `vendor${pad}@plankori.test`;
    const password = "Demo@12345";
    const fullName = VENDOR_NAMES[i - 1] || `Vendor Partner ${pad}`;

    let userId = existingUsersByEmail.get(email.toLowerCase());

    if (!userId) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "vendor",
          full_name: fullName,
        },
      });

      if (createError) {
        console.error(`Failed to create ${email}:`, createError.message);
        continue;
      }
      userId = newUser.user.id;
      console.log(`  ✓ Created user: ${email} (${userId})`);
    } else {
      console.log(`  ✓ Found existing user: ${email} (${userId})`);
    }

    // Ensure profile entry has role 'vendor'
    await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        role: "vendor",
      },
      { onConflict: "id" }
    );

    vendorOwners.push({ id: userId, email });
  }

  if (vendorOwners.length === 0) {
    console.error("❌ No vendor owner accounts could be verified. Aborting.");
    process.exit(1);
  }

  console.log(`✓ 12 vendor accounts verified.`);

  // 2. Seed 84 Listings evenly distributed (7 per vendor owner)
  console.log("\n🏪 Step 2: Seeding 84 Listings and Generating Embeddings...");
  let successCount = 0;

  for (let idx = 0; idx < SEED_VENDORS.length; idx++) {
    const vendorData = SEED_VENDORS[idx];
    const ownerIndex = Math.floor(idx / 7) % vendorOwners.length;
    const owner = vendorOwners[ownerIndex];

    process.stdout.write(
      `  [${idx + 1}/${SEED_VENDORS.length}] Generating embedding for "${vendorData.business_name}" (${vendorData.location_city}, ${vendorData.category})... `
    );

    const { embedding, source } = await embedVendor({
      business_name: vendorData.business_name,
      category: vendorData.category,
      description: vendorData.description,
      tags: vendorData.tags,
      themes: vendorData.themes,
      dietary_options: vendorData.dietary_options,
      location_city: vendorData.location_city,
    });

    const createdAt = new Date(Date.now() - vendorData.days_old * 86400000).toISOString();

    const { error: upsertError } = await supabase.from("vendors").upsert(
      {
        seed_key: vendorData.seed_key,
        owner_id: owner.id,
        business_name: vendorData.business_name,
        category: vendorData.category,
        description: vendorData.description,
        location_city: vendorData.location_city,
        base_price: vendorData.base_price,
        price_unit: vendorData.price_unit,
        min_capacity: vendorData.min_capacity,
        max_capacity: vendorData.max_capacity,
        tags: vendorData.tags,
        themes: vendorData.themes,
        dietary_options: vendorData.dietary_options,
        portfolio_image_urls: vendorData.portfolio_image_urls,
        rating: vendorData.rating,
        review_count: vendorData.review_count,
        is_new: vendorData.is_new,
        is_active: true,
        is_featured: false,
        embedding: `[${embedding.join(",")}]`,
        embedding_source: source,
        created_at: createdAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "seed_key" }
    );

    if (upsertError) {
      console.log(`❌ Error: ${upsertError.message}`);
    } else {
      console.log(`✓ (${source})`);
      successCount++;
    }

    // Small delay to prevent API throttling
    if (source === "live") {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log(`\n🎉 Seeding complete! Successfully seeded ${successCount} of ${SEED_VENDORS.length} vendors.`);

  // 3. Verification Queries
  console.log("\n📊 Step 3: Verifying Database Counts & Categories...");

  const { data: allVendors, error: countErr } = await supabase
    .from("vendors")
    .select("location_city, category, is_new");

  if (countErr || !allVendors) {
    console.error("Error fetching vendor stats:", countErr);
    return;
  }

  console.log(`Total vendors in database: ${allVendors.length}`);

  const cityCounts: Record<string, number> = {};
  const cityCategoryCounts: Record<string, number> = {};
  let totalNew = 0;

  for (const v of allVendors) {
    cityCounts[v.location_city] = (cityCounts[v.location_city] || 0) + 1;
    const catKey = `${v.location_city} -> ${v.category}`;
    cityCategoryCounts[catKey] = (cityCategoryCounts[catKey] || 0) + 1;
    if (v.is_new) totalNew++;
  }

  console.log("\nCity distribution:");
  for (const [city, count] of Object.entries(cityCounts)) {
    console.log(`  - ${city}: ${count}`);
  }

  console.log(`New vendors: ${totalNew} (~${Math.round((totalNew / allVendors.length) * 100)}%)`);

  // 4. Test Scenario 1 Vector Match
  console.log("\n🎯 Step 4: Testing match_vendors for Scenario 1:");
  console.log('Query: "rustic outdoor wedding vegan acoustic Sylhet" in Sylhet (150 guests)...');

  const { embedding: testQueryEmbedding } = await embedVendor({
    business_name: "rustic outdoor wedding",
    category: "venue",
    description: "rustic outdoor wedding vegan acoustic in Sylhet",
    tags: ["rustic", "outdoor", "vegan", "acoustic"],
    themes: ["rustic", "garden", "boho"],
    dietary_options: ["vegan"],
    location_city: "Sylhet",
  });

  const { data: matched, error: rpcErr } = await supabase.rpc("match_vendors", {
    query_embedding: `[${testQueryEmbedding.join(",")}]`,
    p_city: "Sylhet",
    p_headcount: 150,
    match_count: 5,
  });

  if (rpcErr) {
    console.warn("RPC match_vendors returned error (check if RPC migration was run):", rpcErr.message);
  } else if (matched && matched.length > 0) {
    console.log(`Top matches returned: ${matched.length}`);
    for (const m of matched) {
      console.log(
        `  • [${(m.similarity * 100).toFixed(1)}%] ${m.business_name} (${m.category}) — Base: ${m.base_price} BDT, Cap: ${m.min_capacity || 0}-${m.max_capacity || "∞"}`
      );
    }
  } else {
    console.log("No RPC matches returned or RPC not available.");
  }
}

seed().catch((err) => {
  console.error("Unhandled error in seed script:", err);
  process.exit(1);
});
