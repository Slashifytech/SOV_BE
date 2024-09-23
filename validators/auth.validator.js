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
  companyDetails: z.object({
    companyName: z.string().min(1, "Company Name is required"),
    tradeName: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    country: z.string().min(1, "Country is required"),
    province: z.string().min(1, "Province/State is required"),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().min(1, "Postal Code is required"),
  }),
  accountDetails: z.object({
    founderOrCeo: z.object({
      email: z.string().email("Invalid email").min(1, "Email of Founder/CEO is required"),
      phone: z.string().min(1, "Phone of Founder/CEO is required"),
    }),
    primaryContactPerson: z.object({
      name: z.string().min(1, "Primary Contact Person Name is required"),
      email: z.string().email("Invalid email").min(1, "Primary Contact Person Email is required"),
      phone: z.string().min(1, "Primary Contact Person Phone is required"),
    }),
    msaID: z.object({
      email: z.string().email("Invalid email").optional(),
      phone: z.string().optional(),
    }).optional(),
    referralSource: z.string().optional(),
  }),
  password: z.string().min(1, "Password is required"),
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
