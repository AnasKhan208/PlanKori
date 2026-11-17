import fs from "fs";
import path from "path";
import { SEED_VENDORS, type SeedVendor } from "../../data/vendors.seed.ts";
import type { Tables, UserRole, ServiceCategory } from "@/types/db";
import type { CreateEventInput, UpdateEventInput } from "./validators/event.ts";

export interface DemoProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface DemoEvent {
  id: string;
  host_id: string;
  title: string;
  event_type: string;
  event_date: string | null;
  location_city: string;
  budget: number;
  headcount: number;
  theme_description: string | null;
  dietary_needs: string[];
  must_have_categories: string[];
  status: "draft" | "planned" | "booking_requested" | "confirmed" | "cancelled";
  extracted_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DemoPackageItem {
  id: string;
  package_id: string;
  vendor_id: string;
  category: ServiceCategory;
  estimated_cost: number;
  match_score: number | null;
  match_reason: string | null;
  created_at: string;
  vendor?: SeedVendor | Tables<"vendors">;
}

export interface DemoPackage {
  id: string;
  event_id: string;
  tier: "economy" | "standard" | "premium";
  total_cost: number;
  budget_used_percent: number;
  is_selected: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: DemoPackageItem[];
}

interface DemoStoreData {
  profiles: Record<string, DemoProfile>;
  events: Record<string, DemoEvent>;
  packages: Record<string, DemoPackage>;
}

const STORE_PATH = path.resolve(process.cwd(), "data", "demo-store.json");

const DEFAULT_PROFILES: Record<string, DemoProfile> = {
  "host1@plankori.test": {
    id: "h0000000-0000-0000-0000-000000000001",
    email: "host1@plankori.test",
    full_name: "Rahim Chowdhury",
    role: "host",
    phone: "01711223344",
    created_at: "2026-10-01T10:00:00Z",
    updated_at: "2026-10-01T10:00:00Z",
  },
  "host2@plankori.test": {
    id: "h0000000-0000-0000-0000-000000000002",
    email: "host2@plankori.test",
    full_name: "Nusrat Jahan",
    role: "host",
    phone: "01811223344",
    created_at: "2026-10-05T10:00:00Z",
    updated_at: "2026-10-05T10:00:00Z",
  },
  "host3@plankori.test": {
    id: "h0000000-0000-0000-0000-000000000003",
    email: "host3@plankori.test",
    full_name: "Tanvir Ahmed",
    role: "host",
    phone: "01911223344",
    created_at: "2026-10-10T10:00:00Z",
    updated_at: "2026-10-10T10:00:00Z",
  },
  "admin@plankori.test": {
    id: "a0000000-0000-0000-0000-000000000001",
    email: "admin@plankori.test",
    full_name: "Admin User",
    role: "admin",
    phone: "01700000000",
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-01T10:00:00Z",
  },
};

const DEFAULT_EVENTS: Record<string, DemoEvent> = {
  "evt-demo-1": {
    id: "evt-demo-1",
    host_id: "h0000000-0000-0000-0000-000000000001",
    title: "Arif & Nusrat's Grand Holud Night",
    event_type: "Wedding / Holud",
    event_date: "2026-12-25",
    location_city: "Dhaka",
    budget: 800000,
    headcount: 200,
    theme_description: "Traditional Bengali gaye holud with vibrant yellow marigold arches, rickshaw art backdrop, and authentic Old Dhaka kacchi feasts.",
    dietary_needs: ["halal", "traditional Bengali"],
    must_have_categories: ["venue", "catering", "decoration", "photography"],
    status: "draft",
    extracted_json: null,
    created_at: "2026-11-10T12:00:00Z",
    updated_at: "2026-11-10T12:00:00Z",
  },
  "evt-demo-2": {
    id: "evt-demo-2",
    host_id: "h0000000-0000-0000-0000-000000000001",
    title: "Sylhet Retreat & Outdoor Acoustic Wedding",
    event_type: "Wedding",
    event_date: "2026-12-30",
    location_city: "Sylhet",
    budget: 1200000,
    headcount: 150,
    theme_description: "Rustic outdoor wedding amidst tea estate slopes with vegan-friendly catering and live acoustic folk music.",
    dietary_needs: ["vegan", "halal"],
    must_have_categories: ["venue", "catering", "entertainment", "photography", "decoration"],
    status: "planned",
    extracted_json: null,
    created_at: "2026-11-12T14:30:00Z",
    updated_at: "2026-11-12T14:30:00Z",
  },
};

function readStore(): DemoStoreData {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[DemoStore] Error reading demo store, initializing default:", err);
  }

  const initial: DemoStoreData = {
    profiles: { ...DEFAULT_PROFILES },
    events: { ...DEFAULT_EVENTS },
    packages: {},
  };

  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), "utf8");
  } catch (err) {
    console.warn("[DemoStore] Could not write initial demo store:", err);
  }

  return initial;
}

function writeStore(data: DemoStoreData): void {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("[DemoStore] Error saving store to disk:", err);
  }
}

export const demoStore = {
  // Profiles
  getProfileByEmail(email: string): DemoProfile | null {
    const data = readStore();
    return data.profiles[email.toLowerCase()] || null;
  },

  getProfileById(id: string): DemoProfile | null {
    const data = readStore();
    return Object.values(data.profiles).find((p) => p.id === id) || null;
  },

  updateProfile(id: string, updates: { full_name?: string; phone?: string }): DemoProfile | null {
    const data = readStore();
    const profile = Object.values(data.profiles).find((p) => p.id === id);
    if (!profile) return null;

    if (updates.full_name !== undefined) profile.full_name = updates.full_name;
    if (updates.phone !== undefined) profile.phone = updates.phone;
    profile.updated_at = new Date().toISOString();

    writeStore(data);
    return profile;
  },

  // Events
  getEventsForHost(hostId: string): DemoEvent[] {
    const data = readStore();
    return Object.values(data.events)
      .filter((e) => e.host_id === hostId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getEventById(id: string): DemoEvent | null {
    const data = readStore();
    return data.events[id] || null;
  },

  createEvent(hostId: string, input: CreateEventInput): DemoEvent {
    const data = readStore();
    const id = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newEvent: DemoEvent = {
      id,
      host_id: hostId,
      title: input.title,
      event_type: input.event_type,
      event_date: input.event_date,
      location_city: input.location_city,
      budget: input.budget,
      headcount: input.headcount,
      theme_description: input.theme_description,
      dietary_needs: input.dietary_needs || [],
      must_have_categories: input.must_have_categories || [],
      status: "draft",
      extracted_json: null,
      created_at: now,
      updated_at: now,
    };

    data.events[id] = newEvent;
    writeStore(data);
    return newEvent;
  },

  updateEvent(id: string, updates: UpdateEventInput): DemoEvent | null {
    const data = readStore();
    const event = data.events[id];
    if (!event) return null;

    if (updates.title !== undefined) event.title = updates.title;
    if (updates.event_type !== undefined) event.event_type = updates.event_type;
    if (updates.event_date !== undefined) event.event_date = updates.event_date;
    if (updates.location_city !== undefined) event.location_city = updates.location_city;
    if (updates.budget !== undefined) event.budget = updates.budget;
    if (updates.headcount !== undefined) event.headcount = updates.headcount;
    if (updates.theme_description !== undefined) event.theme_description = updates.theme_description;
    if (updates.dietary_needs !== undefined) event.dietary_needs = updates.dietary_needs;
    if (updates.must_have_categories !== undefined) event.must_have_categories = updates.must_have_categories;
    if (updates.status !== undefined) event.status = updates.status;
    event.updated_at = new Date().toISOString();

    writeStore(data);
    return event;
  },

  // Manual Packages
  getPackagesForEvent(eventId: string): DemoPackage[] {
    const data = readStore();
    return Object.values(data.packages).filter((p) => p.event_id === eventId);
  },

  saveManualPackage(eventId: string, vendorKeys: string[]): DemoPackage | null {
    const data = readStore();
    const event = data.events[eventId];
    if (!event) return null;

    const matchedVendors = SEED_VENDORS.filter((v) => vendorKeys.includes(v.seed_key));
    let totalCost = 0;
    const items: DemoPackageItem[] = [];
    const pkgId = `pkg-manual-${Date.now()}`;
    const now = new Date().toISOString();

    for (const v of matchedVendors) {
      let cost = v.base_price;
      if (v.price_unit === "per_person") {
        cost = v.base_price * (event.headcount || 1);
      } else if (v.price_unit === "per_hour") {
        cost = v.base_price * 4; // standard 4-hour estimate
      }
      totalCost += cost;

      items.push({
        id: `pi-${Math.random().toString(36).substring(2, 9)}`,
        package_id: pkgId,
        vendor_id: v.seed_key,
        category: v.category,
        estimated_cost: cost,
        match_score: 1.0,
        match_reason: "Manually selected by host",
        created_at: now,
        vendor: v,
      });
    }

    const budgetUsedPercent = Number(((totalCost / (event.budget || 1)) * 100).toFixed(1));

    // De-select any existing packages for this event
    for (const p of Object.values(data.packages)) {
      if (p.event_id === eventId) {
        p.is_selected = false;
      }
    }

    const newPackage: DemoPackage = {
      id: pkgId,
      event_id: eventId,
      tier: "standard",
      total_cost: totalCost,
      budget_used_percent: budgetUsedPercent,
      is_selected: true,
      notes: "manual",
      created_at: now,
      updated_at: now,
      items,
    };

    data.packages[pkgId] = newPackage;
    writeStore(data);
    return newPackage;
  },
};
