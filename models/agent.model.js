import mongoose, { Schema } from "mongoose";

// Define the schema for the company subdocument
const CompanySchema = new Schema(
  {
    legalName: {
      type: String,
      required: false, // Optional field
    },
    tradeName: {
      type: String,
      required: false, // Optional field
    },
  },
  { _id: false }
);

// Define the schema for the address subdocument
const AddressSchema = new Schema(
  {
    country: {
      type: String,
      required: false, // Optional field
    },
    state: {
      type: String,
      required: false, // Optional field
    },
    city: {
      type: String,
      required: false, // Optional field
    },
    zipCode: {
      type: Number,
      required: false, // Optional field
    },
    fullAddress: {
      type: String,
      required: false, // Optional field
    },
  },
  { _id: false }
);

// Define the schema for the founder subdocument
const FounderSchema = new Schema(
  {
    email: {
      type: String,
      required: false, // Optional field
    },
    phone: {
      type: String,
      required: false, // Optional field
    },
  },
  { _id: false }
);

// Define the schema for the primary contact subdocument
const PrimaryContactSchema = new Schema(
  {
    name: {
      type: String,
      required: false, // Optional field
    },
    email: {
      type: String,
      required: false, // Optional field
    },
    phone: {
      type: String,
      required: false, // Optional field
    },
  },
  { _id: false }
);

// Define the main schema for the agent
const AgentSchema = new Schema(
  {
    type: {
      type: String,
      required: false, // Optional field
    },
    company: {
      type: CompanySchema,
      required: false, // Optional subdocument
    },
    address: {
      type: AddressSchema,
      required: false, // Optional subdocument
    },
    founder: {
      type: FounderSchema,
      required: false, // Optional subdocument
    },
    primaryContact: {
      type: PrimaryContactSchema,
      required: false, // Optional subdocument
    },
    password: {
      type: String,
      required: false, // Optional field
    },
    role: {
      type: String,
      default: "AGENT",
    },
  },
  {
    timestamps: true, // Keep timestamps optional, these are generated automatically
  }
);

// Create and export the Agent model
export const Agent = mongoose.model("Agent", AgentSchema);
