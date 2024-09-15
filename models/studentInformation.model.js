import mongoose, { Schema } from "mongoose";

// Define the schema for personal information
const PersonalInformationSchema = new Schema(
  {
    title: {
      type: String,
      required: false,
    },
    firstName: {
      type: String,
      required: false,
    },
    middleName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      required: false,
    },
    maritalStatus: {
      type: String,
      required: false,
    },
    dob: {
      type: Date,
      required: false,
    },
    firstLanguage: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

// Define the schema for passport details
const PassportDetailsSchema = new Schema(
  {
    passportUpload: {
      type: String,
      required: false,
    },
    countryOfCitizenship: {
      type: String,
      required: false,
    },
    passportNumber: {
      type: String,
      required: false,
    },
    expireDate: {
      type: Date,
      required: false,
    },
  },
  { _id: false }
);

// Define the schema for residence address
const ResidenceAddressSchema = new Schema(
  {
    address: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    zipcode: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

// Define the schema for preferences
const PreferencesSchema = new Schema(
  {
    preferredCountry: {
      type: String,
      required: false,
    },
    preferredState: {
      type: String,
      required: false,
    },
    preferredProgram: {
      type: String,
      required: false,
    },
    preferredLevelOfEducation: {
      type: String,
      required: false,
    },
    preferredInstitution: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

// Define the main schema for the student profile
const StudentInformationSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    personalInformation: {
      type: PersonalInformationSchema,
      required: false,
    },
    passportDetails: {
      type: PassportDetailsSchema,
      required: false,
    },
    residenceAddress: {
      type: ResidenceAddressSchema,
      required: false,
    },
    preferences: {
      type: PreferencesSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the StudentInformation model
export const StudentInformation = mongoose.model(
  "StudentInformation",
  StudentInformationSchema
);
