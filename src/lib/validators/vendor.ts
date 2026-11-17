import { z } from "zod";

export const vendorListingSchema = z.object({
  business_name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(120, "Business name cannot exceed 120 characters"),
  category: z.enum(
    ["venue", "catering", "decoration", "av_tech", "photography", "entertainment"],
    { message: "Please select a valid service category" }
  ),
  location_city: z
    .string()
    .min(2, "City name is required")
    .max(60, "City name cannot exceed 60 characters"),
  description: z
    .string()
    .min(10, "Please provide a descriptive overview (at least 10 characters)")
    .max(2500, "Description cannot exceed 2500 characters"),
  base_price: z.coerce
    .number({ message: "Base price must be a valid number" })
    .int("Base price must be an integer (BDT)")
    .positive("Base price must be greater than zero"),
  price_unit: z.enum(["flat", "per_person", "per_hour"], {
    message: "Invalid price unit",
  }),
  min_capacity: z.coerce
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional(),
  max_capacity: z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  tags: z.array(z.string()).default([]),
  themes: z.array(z.string()).default([]),
  dietary_options: z.array(z.string()).default([]),
  portfolio_image_urls: z
    .array(z.string().url("Must be a valid URL"))
    .max(8, "Maximum 8 portfolio images allowed")
    .default([]),
  is_active: z.boolean().default(true),
});

export type VendorListingInput = z.infer<typeof vendorListingSchema>;
