import { z } from 'zod';

// Company Details Schema
const CompanyDetailsSchema = z.object({
  businessName: z.string().min(1, { message: "Business Name is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  provinceState: z.string().min(1, { message: "Province/State is required" }),
  city: z.string().min(1, { message: "City is required" }),
  postalCode: z.string().min(1, { message: "Postal Code is required" }),
  phoneNumber: z.string().min(1, { message: "Phone Number is required" }),
  website: z.string().min(1, { message: "Website is required" }),
  linkedin: z.string().optional(), // Optional field
  whatsappNumber: z.string().min(1, { message: "Whatsapp Number is required" }),
});

// Primary Contact Schema
const PrimaryContactSchema = z.object({
  title: z.string().optional(),
  firstName: z.string().min(1, { message: "First Name is required" }),
  lastName: z.string().min(1, { message: "Last Name is required" }),
  positionJobTitle: z.string().min(1, { message: "Position/Job Title is required" }),
  emailUsername: z.string().email({ message: "Valid Email is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  phoneNumber: z.string().optional(),
});

// Commission Contact Schema
const CommissionContactSchema = z.object({
  fullName: z.string().min(1, { message: "Full Name is required" }),
  positionJobTitle: z.string().min(1, { message: "Position/Job Title is required" }),
  email: z.string().email({ message: "Valid Email is required" }),
  phoneNumber: z.string().min(1, { message: "Phone Number is required" }),
});

// Admissions Contact Schema
const AdmissionsContactSchema = z.object({
  destinationCountry: z.string().min(1, { message: "Destination Country is required" }),
  fullName: z.string().min(1, { message: "Full Name is required" }),
  positionJobTitle: z.string().min(1, { message: "Position/Job Title is required" }),
  email: z.string().email({ message: "Valid Email is required" }),
  mobileNumber: z.string().min(1, { message: "Mobile Number is required" }),
});

// Company Contact Schema
const CompanyContactSchema = z.object({
  primaryContact: PrimaryContactSchema,
  commissionContact: CommissionContactSchema.optional(), // Optional
  admissionsContacts: z.array(AdmissionsContactSchema).optional(), // Optional array
});

// Bank Details Schema
const BankDetailsSchema = z.object({
  bankName: z.string().min(1, { message: "Bank Name is required" }),
  branchName: z.string().min(1, { message: "Branch Name is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  provinceState: z.string().min(1, { message: "Province/State is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  city: z.string().min(1, { message: "City is required" }),
  postalCode: z.string().min(1, { message: "Postal Code is required" }),
  swiftBicCode: z.string().min(1, { message: "SWIFT/BIC Code is required" }),
  sortCode: z.string().min(1, { message: "Sort Code is required" }),
  bankAccountName: z.string().min(1, { message: "Bank Account Name is required" }),
  bankAccountNumber: z.string().min(1, { message: "Bank Account Number is required" }),
  intermediarySwiftCode: z.string().min(1, { message: "Intermediary SWIFT Code is required" }),
  iban: z.string().min(1, { message: "IBAN is required" }),
});

// Company Overview Schema
const CompanyOverviewSchema = z.object({
  businessOperationStartYear: z.string().min(1, { message: "Business Operation Start Year is required" }),
  numberOfStudents: z.number().min(1, { message: "Number of Students is required" }),
  popularDestinations: z.array(z.string()).min(1, { message: "At least one popular destination is required" }),
  studentSourceCountries: z.array(z.string()).min(1, { message: "At least one student source country is required" }),
  governmentLicensed: z.enum(['Yes', 'No', 'Not Required in our country'], { 
    required_error: "Government License status is required" 
  }),
  businessRegistrationNumber: z.string().min(1, { message: "Business Registration Number is required" }),
  businessRegistrationDocument: z.string().min(1, { message: "Business Registration Document is required" }),
  higherEducationProgrammes: z.array(z.string()).min(1, { message: "At least one higher education programme is required" }),
  financeSources: z.array(z.string()).min(1, { message: "At least one finance source is required" }),
  studyDestinations: z.array(z.string()).min(1, { message: "At least one study destination is required" }),
  businessProfileDocument: z.string().min(1, { message: "Business Profile Document is required" }),
});

// Company Operations Schema
const CompanyOperationsSchema = z.object({
  numberOfCounselors: z.number().min(1, { message: "Number of Counselors is required" }),
  averageExperienceYears: z.number().min(1, { message: "Average Experience in Years is required" }),
  advertisementMethods: z.array(z.string()).min(1, { message: "At least one advertisement method is required" }),
  socialMediaPlatforms: z.array(z.string()).min(1, { message: "At least one social media platform is required" }),
});

// Reference Schema
const ReferenceSchema = z.object({
  referenceType: z.string().min(1, { message: "Reference Type is required" }),
  contactPerson: z.string().min(1, { message: "Contact Person is required" }),
  institutionName: z.string().min(1, { message: "Institution Name is required" }),
  designation: z.string().min(1, { message: "Designation is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  contactNumber: z.string().min(1, { message: "Contact Number is required" }),
  email: z.string().email({ message: "Valid Email is required" }),
});

export {
  CompanyDetailsSchema,
  CompanyContactSchema,
  BankDetailsSchema,
  CompanyOverviewSchema,
  CompanyOperationsSchema,
  ReferenceSchema,
};
