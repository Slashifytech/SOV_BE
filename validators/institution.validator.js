import { z } from "zod";

// Zod schema for Address (fields are now required)
const AddressSchema = z.object({
  street: z.string().nonempty("Street is required"),
  city: z.string().nonempty("City is required"),
  state: z.string().nonempty("State is required"),
  postalCode: z.string().nonempty("Postal Code is required"),
  country: z.string().nonempty("Country is required"),
});

// Zod schema for Personal Information
const PersonalInformationSchema = z.object({
  fullName: z.string().nonempty("Full Name is required"),
  email: z.string().email("Invalid email address").nonempty("Email is required"),
  phoneNumber: z.string().nonempty("Phone Number is required"),
  address: AddressSchema,  // Address fields are now required
});

// Zod schema for Education Details
const EducationDetailsSchema = z.object({
  educationLevel: z.enum(['Diploma', 'Post Graduate', 'Under Graduate']),
  markSheet: z.array(z.string()).optional(),  // Array of URLs or file paths for marksheets
});

// Zod schema for Preferences
const PreferencesSchema = z.object({
  country: z.string().nonempty("Country is required"),
  institution: z.string().nonempty("Institution is required"),
  course: z.string().nonempty("Course is required"),
  intake: z.string().nonempty("Intake is required"),
});

// Updated Zod schema for IELTS Score (fields are required)
const IELTSSchema = z.object({
  reading: z.number().nonnegative("Reading score must be non-negative").min(0, "Minimum score is 0").max(9, "Maximum score is 9"),
  speaking: z.number().nonnegative("Speaking score must be non-negative").min(0, "Minimum score is 0").max(9, "Maximum score is 9"),
  writing: z.number().nonnegative("Writing score must be non-negative").min(0, "Minimum score is 0").max(9, "Maximum score is 9"),
  listening: z.number().nonnegative("Listening score must be non-negative").min(0, "Minimum score is 0").max(9, "Maximum score is 9"),
  overallBand: z.number().optional(),  // Keep this optional if not required
});

// Zod schema for Offer Letter
export const OfferLetterSchema = z.object({
  personalInformation: PersonalInformationSchema,
  educationDetails: EducationDetailsSchema,
  preferences: PreferencesSchema,
  ieltsScore: IELTSSchema,  // Required because all fields inside it are required
  studentInformationId: z.string().nonempty("studentInformationId is required"),
});


// Zod schema for Personal Information
const PersonalInformationGICSchema = z.object({
  fullName: z.string().optional(),  // Now optional
  email: z.string().email("Invalid email address").optional(),  // Now optional
  phoneNumber: z.string().optional(),  // Now optional
  address: AddressSchema.optional(),  // Now optional
});

// Zod schema for Document Upload
const DocumentUploadSchema = z.object({
  offerLetter: z.string().nonempty("Offer Letter is required"),  // Required field
  letterOfAcceptance: z.string().optional(),  // Optional URL or file path for the letter of acceptance
});

// Zod schema for GIC
export const GICSchema = z.object({
  personalDetails: PersonalInformationGICSchema,
  documentUpload: DocumentUploadSchema,
  studentInformationId: z.string().nonempty("studentInformationId is required"),
});
