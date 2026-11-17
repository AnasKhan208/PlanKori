import { z } from "zod";

export const signupSchema = z.object({
  role: z.enum(["host", "vendor"], {
    message: "Please select whether you are a Host or a Vendor",
  }),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters long")
    .max(100, "Full name cannot exceed 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(/^(\+?8801|01)[3-9]\d{8}$/, "Please enter a valid Bangladeshi phone number (e.g. 017XXXXXXXX)")
    .or(z.literal(""))
    .optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(72, "Password cannot exceed 72 characters"),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
