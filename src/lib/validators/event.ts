import { z } from "zod";

export const eventStep1Schema = z.object({
  event_type: z
    .string()
    .min(2, "Please select or enter an event type")
    .max(50, "Event type too long"),
  title: z
    .string()
    .min(3, "Event title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),
  event_date: z
    .string()
    .min(1, "Please select an event date")
    .refine((val) => {
      const selected = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !isNaN(selected.getTime()) && selected >= today;
    }, { message: "Event date must be in the future" }),
});

export const eventStep2Schema = z.object({
  location_city: z
    .string()
    .min(2, "Please choose or enter a city")
    .max(60, "City name too long"),
  headcount: z
    .number({ message: "Headcount must be a number" })
    .int("Headcount must be a whole number")
    .min(1, "Headcount must be at least 1 guest")
    .max(10000, "Headcount cannot exceed 10,000"),
});

export const eventStep3Schema = z.object({
  budget: z
    .number({ message: "Budget must be a number" })
    .int("Budget must be an integer in BDT")
    .min(5000, "Budget must be at least 5,000 BDT"),
  dietary_needs: z.array(z.string()),
});

export const eventStep4Schema = z.object({
  theme_description: z
    .string()
    .min(5, "Please describe your preferred theme, mood, or vibe (at least 5 characters)")
    .max(1500, "Theme description cannot exceed 1500 characters"),
  must_have_categories: z.array(z.string()),
});

export const createEventSchema = eventStep1Schema
  .merge(eventStep2Schema)
  .merge(eventStep3Schema)
  .merge(eventStep4Schema);

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["draft", "planned", "booking_requested", "confirmed", "cancelled"]).optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

