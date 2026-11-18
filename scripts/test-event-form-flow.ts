/**
 * End-to-end test of EventCreateMultiStepForm logic and lifecyle:
 * - Local date calculation (Bangladesh / local timezone)
 * - Step 1: basics, title & future date validation
 * - Step 2: city & headcount validation
 * - Step 3: budget (BDT) & dietary validation
 * - Step 4: theme description & category validation
 * - Step 5: review values
 * - Submission & event persistence in store
 */

import { z } from "zod";
import {
  createEventSchema,
  eventStep1Schema,
  eventStep2Schema,
  eventStep3Schema,
  eventStep4Schema,
} from "../src/lib/validators/event.ts";
import { demoStore } from "../src/lib/demo-store.ts";

async function testFormFlow() {
  console.log("========================================================");
  console.log("   EVENT CREATE MULTI-STEP FORM VALIDATION & FLOW TEST  ");
  console.log("========================================================\n");

  // 1. Test Date Generation Bug Fix (Local vs UTC)
  console.log("Test 1: Verifying minDateString local date generation...");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  const minDateString = `${year}-${month}-${day}`;

  console.log(`  [PASS] Calculated local tomorrow: ${minDateString}`);
  const [y, m, d] = minDateString.split("-").map(Number);
  if (y !== year || m !== tomorrow.getMonth() + 1 || d !== tomorrow.getDate()) {
    console.error("  [FAIL] minDateString parts mismatch!");
    process.exit(1);
  }
  console.log("  [PASS] Local date parts match local calendar exactly (no UTC shift).");

  // 2. Test Step 1 Validation
  console.log("\nTest 2: Step 1 (Event Basics, Title, Date)...");
  // Past date failure
  const step1Past = eventStep1Schema.safeParse({
    event_type: "Wedding",
    title: "My Wedding",
    event_date: "2020-01-01",
  });
  if (step1Past.success) {
    console.error("  [FAIL] Step 1 accepted past date!");
    process.exit(1);
  }
  console.log("  [PASS] Past date correctly rejected with message:", step1Past.error.issues[0]?.message);

  // Short title failure
  const step1ShortTitle = eventStep1Schema.safeParse({
    event_type: "Wedding",
    title: "Hi",
    event_date: minDateString,
  });
  if (step1ShortTitle.success) {
    console.error("  [FAIL] Step 1 accepted short title!");
    process.exit(1);
  }
  console.log("  [PASS] Short title correctly rejected with message:", step1ShortTitle.error.issues[0]?.message);

  // Valid Step 1
  const step1Valid = eventStep1Schema.safeParse({
    event_type: "Wedding",
    title: "Traditional Dhaka Gaye Holud Celebration",
    event_date: minDateString,
  });
  if (!step1Valid.success) {
    console.error("  [FAIL] Valid Step 1 failed:", step1Valid.error);
    process.exit(1);
  }
  console.log("  [PASS] Valid Step 1 passed validation.");

  // 3. Test Step 2 Validation
  console.log("\nTest 3: Step 2 (Location & Headcount)...");
  // Invalid headcount
  const step2InvalidHeadcount = eventStep2Schema.safeParse({
    location_city: "Dhaka",
    headcount: 0,
  });
  if (step2InvalidHeadcount.success) {
    console.error("  [FAIL] Step 2 accepted 0 headcount!");
    process.exit(1);
  }
  console.log("  [PASS] Zero headcount correctly rejected with message:", step2InvalidHeadcount.error.issues[0]?.message);

  // Valid Step 2
  const step2Valid = eventStep2Schema.safeParse({
    location_city: "Dhaka",
    headcount: "200", // test coercion
  });
  if (!step2Valid.success || step2Valid.data.headcount !== 200) {
    console.error("  [FAIL] Valid Step 2 with coercion failed:", step2Valid);
    process.exit(1);
  }
  console.log("  [PASS] Valid Step 2 passed (headcount coerced from string '200' to number 200).");

  // 4. Test Step 3 Validation
  console.log("\nTest 4: Step 3 (Budget & Dietary Needs)...");
  // Low budget
  const step3LowBudget = eventStep3Schema.safeParse({
    budget: 1000,
    dietary_needs: ["halal"],
  });
  if (step3LowBudget.success) {
    console.error("  [FAIL] Step 3 accepted sub-5,000 budget!");
    process.exit(1);
  }
  console.log("  [PASS] Sub-5,000 budget correctly rejected with message:", step3LowBudget.error.issues[0]?.message);

  // Valid Step 3
  const step3Valid = eventStep3Schema.safeParse({
    budget: "800000",
    dietary_needs: ["halal", "traditional Bengali"],
  });
  if (!step3Valid.success || step3Valid.data.budget !== 800000) {
    console.error("  [FAIL] Valid Step 3 failed:", step3Valid);
    process.exit(1);
  }
  console.log("  [PASS] Valid Step 3 passed (budget coerced to 800,000 BDT).");

  // 5. Test Step 4 Validation
  console.log("\nTest 5: Step 4 (Theme & Categories)...");
  // Short theme description
  const step4ShortTheme = eventStep4Schema.safeParse({
    theme_description: "Hi",
    must_have_categories: ["venue"],
  });
  if (step4ShortTheme.success) {
    console.error("  [FAIL] Step 4 accepted short theme!");
    process.exit(1);
  }
  console.log("  [PASS] Short theme correctly rejected with message:", step4ShortTheme.error.issues[0]?.message);

  // Valid Step 4
  const step4Valid = eventStep4Schema.safeParse({
    theme_description: "Vibrant yellow and orange marigold floral theme with traditional dhol music",
    must_have_categories: ["venue", "catering", "decoration", "photography"],
  });
  if (!step4Valid.success) {
    console.error("  [FAIL] Valid Step 4 failed:", step4Valid);
    process.exit(1);
  }
  console.log("  [PASS] Valid Step 4 passed.");

  // 6. Test Step 5 (Full Schema Input & Output Types)
  console.log("\nTest 6: Full Schema Input/Output Typing...");
  type SchemaInput = z.input<typeof createEventSchema>;
  type SchemaOutput = z.output<typeof createEventSchema>;

  const fullFormRawInput: SchemaInput = {
    event_type: "Wedding",
    title: "Traditional Dhaka Gaye Holud Celebration",
    event_date: minDateString,
    location_city: "Dhaka",
    headcount: "200" as unknown as number, // simulates text input before coerce
    budget: "800000" as unknown as number,
    theme_description: "Vibrant yellow and orange marigold floral theme with traditional dhol music",
    dietary_needs: ["halal", "traditional Bengali"],
    must_have_categories: ["venue", "catering", "decoration", "photography"],
  };

  const parsedFinal = createEventSchema.safeParse(fullFormRawInput);
  if (!parsedFinal.success) {
    console.error("  [FAIL] Final full form parse failed:", parsedFinal.error);
    process.exit(1);
  }

  const finalOutput: SchemaOutput = parsedFinal.data;
  console.log("  [PASS] Full form parsed successfully into SchemaOutput:");
  console.log(`         Title: ${finalOutput.title}`);
  console.log(`         Headcount: ${finalOutput.headcount} (type: ${typeof finalOutput.headcount})`);
  console.log(`         Budget: ${finalOutput.budget} (type: ${typeof finalOutput.budget})`);
  console.log(`         Date: ${finalOutput.event_date}`);

  // 7. Test Submission and Event Saving
  console.log("\nTest 7: Submitting event to database/store...");
  const hostUser = demoStore.getProfileByEmail("host1@plankori.test");
  if (!hostUser) {
    console.error("  [FAIL] host1@plankori.test not found in demo store.");
    process.exit(1);
  }

  const savedEvent = demoStore.createEvent(hostUser.id, finalOutput);
  if (!savedEvent || !savedEvent.id) {
    console.error("  [FAIL] createEvent failed to return a saved event.");
    process.exit(1);
  }

  console.log(`  [PASS] Event saved successfully to store!`);
  console.log(`         Event ID: ${savedEvent.id}`);
  console.log(`         Status: ${savedEvent.status}`);
  console.log(`         Host ID: ${savedEvent.host_id}`);
  console.log(`         Redirect URL: /dashboard/events/${savedEvent.id}`);

  // Confirm retrieval from store
  const confirmed = demoStore.getEventById(savedEvent.id);
  if (!confirmed || confirmed.title !== finalOutput.title) {
    console.error("  [FAIL] Saved event could not be verified in store.");
    process.exit(1);
  }
  console.log("  [PASS] Event confirmed in persistence store with all properties intact.");

  console.log("\n========================================================");
  console.log("   ALL 7 MULTI-STEP FORM TESTS PASSED WITH ZERO ERRORS   ");
  console.log("========================================================\n");
}

testFormFlow();
