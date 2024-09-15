import { z } from "zod";

export const registerStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Enter a valid email address")
    .nonempty("Email is required"),
  country: z.string().min(1, "Country is required"),
  code: z.string().min(1, "Phone code is required"),
  number: z.string().min(1, "Phone number is required"),
  studentType: z.string().min(1, "Student type is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const registerAgentSchema = z.object({
  type: z.string().min(1, "Agent type is required"),
  company: z.object({
    legalName: z.string().min(1, "Legal company name is required"),
    tradeName: z.string().optional(),
  }),
  address: z.object({
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
    zipCode: z.number().int().min(1000, "Invalid zip code"),
    fullAddress: z.string().min(1, "Full address is required"),
  }),
  founder: z.object({
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(1, "Phone number is required"),
  }),
  primaryContact: z.object({
    name: z.string().min(1, "Primary contact name is required"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(1, "Primary contact phone number is required"),
  }),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const loginSchema = z.object({
  role: z.string().min(1, "Enter the type"),
  email: z
    .string()
    .email("Enter a valid email address")
    .nonempty("Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
});
