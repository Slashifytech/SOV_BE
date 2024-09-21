import { z } from 'zod';

const CompanyDetailsSchema = z.object({
  businessName: z.string().min(1, { message: "Business Name is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  provinceState: z.string().min(1, { message: "Province/State is required" }),
  city: z.string().min(1, { message: "City is required" }),
  postalCode: z.string().min(1, { message: "Postal Code is required" }),
  phoneNumber: z.string().min(1, { message: "Phone Number is required" }),
  website: z.string(),  // Required field
  linkedin: z.string().optional(), // Only linkedin is optional
  whatsappNumber: z.string().min(1, { message: "Whatsapp Number is required" }),
});

// Primary Contact Schema
const PrimaryContactSchema = z.object({
    title: z.string().optional(),
    firstName: z.string(),
    lastName: z.string(),
    positionJobTitle: z.string(),
    emailUsername: z.string().email(),
    country: z.string(),
    mobile: z.string(),
    phoneNumber: z.string().optional(),
  });
  
  // Commission Contact Schema
  const CommissionContactSchema = z.object({
    fullName: z.string(),
    positionJobTitle: z.string(),
    email: z.string().email(),
    phoneNumber: z.string(),
  });
  
  // Admissions Contact Schema
  const AdmissionsContactSchema = z.object({
    destinationCountry: z.string(),
    fullName: z.string(),
    positionJobTitle: z.string(),
    email: z.string().email(),
    mobileNumber: z.string(),
  });
  
  // Main Schema combining all three
  const CompanyContactSchema = z.object({
    primaryContact: PrimaryContactSchema,
    commissionContact: CommissionContactSchema.optional(),
    admissionsContacts: z.array(AdmissionsContactSchema).optional(), // Array of multiple admissions contacts
  });

  const BankDetailsSchema = z.object({
    bankName: z.string().optional(),
    branchName: z.string().optional(),
    country: z.string().optional(),
    provinceState: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    swiftBicCode: z.string().optional(),
    sortCode: z.string().optional(),
    bankAccountName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    intermediarySwiftCode: z.string().optional(),
    iban: z.string().optional(),
  });


   const CompanyOverviewSchema = z.object({
    businessOperationStartYear: z.string().optional(), // Optional string field
    numberOfStudents: z.number().optional(), // Optional number field
    popularDestinations: z.array(z.string()).optional(), // Optional array of strings
    studentSourceCountries: z.array(z.string()).optional(), // Optional array of strings
    governmentLicensed: z.enum(['Yes', 'No', 'Not Required in our country']).optional(), // Enum with restricted values
    businessRegistrationNumber: z.string().optional(), // Optional string field
    businessRegistrationDocument: z.string().optional(), // Optional string field (Assumed to be a URL or file path)
    higherEducationProgrammes: z.array(z.string()).optional(), // Optional array of strings
    financeSources: z.array(z.string()).optional(), // Optional array of strings
    studyDestinations: z.array(z.string()).optional(), // Optional array of strings
    businessProfileDocument: z.string().optional(), // Optional string field (Assumed to be a URL or file path)
  });

  const CompanyOperationsSchema = z.object({
    numberOfCounselors: z.number().optional(), // Optional number field
    averageExperienceYears: z.number().optional(), // Optional number field
    advertisementMethods: z.array(z.string()).optional(), // Optional array of strings
    socialMediaPlatforms: z.array(z.string()).optional(), // Optional array of strings
  });

  const ReferenceSchema = z.object({
    referenceType: z.string().optional(), // Optional string field for type of reference
    contactPerson: z.string().optional(), // Optional string field for contact person's name
    institutionName: z.string().optional(), // Optional string field for institution's name
    designation: z.string().optional(), // Optional string field for designation
    country: z.string().optional(), // Optional string field for country
    contactNumber: z.string().optional(), // Optional string field for contact number
    email: z.string().email().optional(), // Optional string field for email, validated as a proper email format
  });

export  {CompanyDetailsSchema, CompanyContactSchema, BankDetailsSchema, CompanyOverviewSchema, CompanyOperationsSchema, ReferenceSchema};
