import { z } from "zod";


 const loginSchema = z.object({
    role: z.string().min(1, "Enter the type"),
    email: z
      .string()
      .email("Enter a valid email address")
      .nonempty("Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  });

const changePasswordSchema = z.object({
    oldPassword: z.string().min(6, "Password must be at least 6 characters long"),
    newPassword: z.string().min(6, "Password must be at least 6 characters long"),
  });

  const changeEmailSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    email: z
    .string()
    .email("Enter a valid email address")
    .nonempty("Email is required"),
  });
  

export {loginSchema, changePasswordSchema, changeEmailSchema };
