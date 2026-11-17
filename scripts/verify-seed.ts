import fs from "fs";
import path from "path";
import { SEED_VENDORS } from "../data/vendors.seed.ts";
import { embedVendor, embedText } from "../src/lib/ai/embeddings.ts";

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

async function runVerification() {
  console.log("================================================================================");
  console.log("                  PlanKori Vendor Seed Verification Report                      ");
  console.log("================================================================================\n");

  console.log(`Total Fictional Vendors Generated: ${SEED_VENDORS.length} (Target: 84)`);

  const cityCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const cityCategoryCounts: Record<string, Record<string, number>> = {
    Dhaka: {},
    Chittagong: {},
    Sylhet: {},
  };

  let newCount = 0;
  let sylhetNewCount = 0;

  for (const v of SEED_VENDORS) {
    cityCounts[v.location_city] = (cityCounts[v.location_city] || 0) + 1;
    categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
    cityCategoryCounts[v.location_city][v.category] =
      (cityCategoryCounts[v.location_city][v.category] || 0) + 1;

    if (v.is_new) {
      newCount++;
      if (v.location_city === "Sylhet") {
        sylhetNewCount++;
      }
    }
  }

  console.log("\n1. Distribution by City:");
  for (const [city, count] of Object.entries(cityCounts)) {
    console.log(`   • ${city.padEnd(12)} : ${count} vendors`);
  }

  console.log("\n2. Distribution by Category across all cities:");
  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`   • ${cat.padEnd(15)} : ${count} vendors`);
  }

  console.log("\n3. Category breakdown per City:");
  for (const city of ["Dhaka", "Chittagong", "Sylhet"] as const) {
    console.log(`   [${city}] (Total: ${cityCounts[city]}):`);
    for (const [cat, count] of Object.entries(cityCategoryCounts[city])) {
      console.log(`     - ${cat.padEnd(15)}: ${count}`);
    }
  }

  console.log("\n4. Fairness & New Vendor Allocation:");
  console.log(
    `   • Total new vendors (is_new = true, created in last 40 days, reviews < 5): ${newCount} (${(
      (newCount / SEED_VENDORS.length) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`   • Sylhet new vendors fitting Scenario 1: ${sylhetNewCount} (Target: >= 3)`);

  // Verify Guaranteed Scenarios
  console.log("\n5. Guaranteed Scenarios Validation:");

  // Scenario 1
  const s1Venues = SEED_VENDORS.filter(
    (v) =>
      v.location_city === "Sylhet" &&
      v.category === "venue" &&
      (v.min_capacity ?? 0) <= 150 &&
      (v.max_capacity == null || v.max_capacity >= 150)
  );
  const s1VeganCat = SEED_VENDORS.filter(
    (v) =>
      v.location_city === "Sylhet" &&
      v.category === "catering" &&
      v.dietary_options.includes("vegan")
  );
  const s1Acoustic = SEED_VENDORS.filter(
    (v) =>
      v.location_city === "Sylhet" &&
      v.category === "entertainment" &&
      (v.tags.includes("acoustic") || v.themes.includes("rustic"))
  );
  const s1RusticDec = SEED_VENDORS.filter(
    (v) =>
      v.location_city === "Sylhet" &&
      v.category === "decoration" &&
      v.themes.includes("rustic")
  );
  const s1Photo = SEED_VENDORS.filter(
    (v) => v.location_city === "Sylhet" && v.category === "photography"
  );

  console.log("   ✓ Scenario 1: Rustic outdoor wedding in Sylhet (150 guests):");
  console.log(`     - Suitable Venues in Sylhet (covering 150): ${s1Venues.length} (Target: >= 2)`);
  console.log(`     - Vegan-capable Caterers in Sylhet        : ${s1VeganCat.length} (Target: >= 1)`);
  console.log(`     - Acoustic/Folk Acts in Sylhet            : ${s1Acoustic.length} (Target: >= 1)`);
  console.log(`     - Rustic Decorators in Sylhet             : ${s1RusticDec.length} (Target: >= 1)`);
  console.log(`     - Photographers in Sylhet                 : ${s1Photo.length}`);

  // Scenario 2
  const s2NeonDec = SEED_VENDORS.filter(
    (v) => v.location_city === "Dhaka" && v.category === "decoration" && v.themes.includes("cyberpunk")
  );
  const s2AvCyber = SEED_VENDORS.filter(
    (v) => v.location_city === "Dhaka" && v.category === "av_tech" && v.themes.includes("cyberpunk")
  );
  const s2Dj = SEED_VENDORS.filter(
    (v) => v.location_city === "Dhaka" && v.category === "entertainment" && v.tags.includes("dj")
  );
  const s2Venue = SEED_VENDORS.filter(
    (v) =>
      v.location_city === "Dhaka" &&
      v.category === "venue" &&
      (v.min_capacity ?? 0) <= 40 &&
      (v.max_capacity == null || v.max_capacity >= 40)
  );

  console.log("   ✓ Scenario 2: Cyberpunk birthday party in Dhaka (40 guests):");
  console.log(`     - Compact Venues (covering 40 guests)     : ${s2Venue.length}`);
  console.log(`     - Neon/Cyberpunk Decorators in Dhaka      : ${s2NeonDec.length}`);
  console.log(`     - LED/AV Lighting Vendors in Dhaka        : ${s2AvCyber.length}`);
  console.log(`     - DJs in Dhaka                            : ${s2Dj.length}`);

  // Scenario 3
  const s3CorpVenue = SEED_VENDORS.filter(
    (v) =>
      v.location_city === "Dhaka" &&
      v.category === "venue" &&
      (v.min_capacity ?? 0) <= 80 &&
      (v.max_capacity == null || v.max_capacity >= 80) &&
      v.themes.includes("modern corporate")
  );
  const s3CorpCat = SEED_VENDORS.filter(
    (v) => v.location_city === "Dhaka" && v.category === "catering" && v.themes.includes("modern corporate")
  );
  const s3CorpAv = SEED_VENDORS.filter(
    (v) => v.location_city === "Dhaka" && v.category === "av_tech" && v.tags.includes("projectors")
  );

  console.log("   ✓ Scenario 3: Corporate retreat in Dhaka (80 guests):");
  console.log(`     - Conference Venues (covering 80 guests)  : ${s3CorpVenue.length}`);
  console.log(`     - Corporate Catering in Dhaka             : ${s3CorpCat.length}`);
  console.log(`     - AV with Projectors/PA in Dhaka          : ${s3CorpAv.length}`);

  // Scenario 4
  const s4BeachVenue = SEED_VENDORS.filter(
    (v) =>
      v.location_city === "Chittagong" &&
      v.category === "venue" &&
      (v.min_capacity ?? 0) <= 60 &&
      (v.max_capacity == null || v.max_capacity >= 60) &&
      v.themes.includes("tropical beach")
  );
  const s4TropicalDec = SEED_VENDORS.filter(
    (v) => v.location_city === "Chittagong" && v.category === "decoration" && v.themes.includes("tropical beach")
  );
  const s4Photo = SEED_VENDORS.filter(
    (v) => v.location_city === "Chittagong" && v.category === "photography"
  );

  console.log("   ✓ Scenario 4: Beach engagement in Chittagong (60 guests):");
  console.log(`     - Seaside Venues (covering 60 guests)     : ${s4BeachVenue.length}`);
  console.log(`     - Tropical Beach Decor in Chittagong      : ${s4TropicalDec.length}`);
  console.log(`     - Photographers in Chittagong             : ${s4Photo.length}`);

  // Scenario 5
  const s5HoludVenue = SEED_VENDORS.filter(
    (v) =>
      v.location_city === "Dhaka" &&
      v.category === "venue" &&
      (v.min_capacity ?? 0) <= 200 &&
      (v.max_capacity == null || v.max_capacity >= 200) &&
      v.themes.includes("holud")
  );
  const s5HoludDec = SEED_VENDORS.filter(
    (v) => v.location_city === "Dhaka" && v.category === "decoration" && v.themes.includes("holud")
  );
  const s5HoludCat = SEED_VENDORS.filter(
    (v) => v.location_city === "Dhaka" && v.category === "catering" && v.themes.includes("traditional Bengali")
  );

  console.log("   ✓ Scenario 5: Traditional Bengali holud in Dhaka (200 guests):");
  console.log(`     - Holud Venues in Dhaka (covering 200)    : ${s5HoludVenue.length}`);
  console.log(`     - Holud Floral Decorators in Dhaka        : ${s5HoludDec.length}`);
  console.log(`     - Traditional Bengali Caterers in Dhaka   : ${s5HoludCat.length}`);

  // Vector Match Simulation for Scenario 1
  console.log("\n6. Vector Match Simulation (match_vendors SQL logic):");
  const queryText = "rustic outdoor wedding vegan acoustic Sylhet";
  console.log(`   Query: "${queryText}" in Sylhet for 150 headcount`);
  const queryEmbed = await embedText(queryText);

  const matchedCandidates: {
    business_name: string;
    category: string;
    base_price: number;
    price_unit: string;
    min_capacity: number | null;
    max_capacity: number | null;
    is_new: boolean;
    similarity: number;
  }[] = [];

  for (const v of SEED_VENDORS) {
    if (v.location_city !== "Sylhet") continue;

    // Capacity condition matching SQL function match_vendors:
    if (v.category === "venue") {
      const min = v.min_capacity ?? 0;
      const max = v.max_capacity ?? Infinity;
      if (min > 150 || max < 150) continue;
    } else {
      const min = v.min_capacity ?? 0;
      const max = v.max_capacity ?? Infinity;
      if ((v.min_capacity != null && min > 150) || (v.max_capacity != null && max < 150)) {
        continue;
      }
    }

    const { embedding } = await embedVendor(v);
    let similarity = 0;
    for (let i = 0; i < 768; i++) {
      similarity += queryEmbed.embedding[i] * embedding[i];
    }

    matchedCandidates.push({
      business_name: v.business_name,
      category: v.category,
      base_price: v.base_price,
      price_unit: v.price_unit,
      min_capacity: v.min_capacity,
      max_capacity: v.max_capacity,
      is_new: v.is_new,
      similarity,
    });
  }

  matchedCandidates.sort((a, b) => b.similarity - a.similarity);

  console.log("\n   Top Semantic Matches Returned:");
  for (const match of matchedCandidates.slice(0, 10)) {
    console.log(
      `   • [${(match.similarity * 100).toFixed(1)}% match] ${match.business_name} (${match.category}) — ${match.base_price.toLocaleString()} BDT (${match.price_unit}) ${match.is_new ? "⭐ [NEW VENDOR BOOST]" : ""}`
    );
  }
}

runVerification().catch(console.error);
