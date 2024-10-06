import mongoose, { Schema } from "mongoose";

// Define the schema for bank details
const BankDetailsSchema = new Schema(
  {
    bankName: {
      type: String,
      required: false, // Optional field
    },
    branchName: {
      type: String,
      required: false, // Optional field
    },
    country: {
      type: String,
      required: false, // Optional field
    },
    province: {
      type: String,
      required: false, // Optional field
    },
    address: {
      type: String,
      required: false, // Optional field
    },
    city: {
      type: String,
      required: false, // Optional field
    },
    postalCode: {
      type: String,
      required: false, // Optional field
    },
    bankAccountName: {
      type: String,
      required: false, // Optional field
    },
    bankAccountNumber: {
      type: String,
      required: false, // Optional field
    },
    swiftBicCode: {
      type: String,
      required: false, // Optional field
    },
    iban: {
      type: String, // Optional field
      required: false,
    },
  },
  { _id: false }
);

// Define the schema for document upload (Aadhar and Pan card)
const DocumentUploadSchema = new Schema(
  {
    aadharCard: {
      filename: {
        type: String,
        required: false, // Optional field
      },
    },
    panCard: {
      filename: {
        type: String,
        required: false, // Optional field
      },
    },
  },
  { _id: false }
);

// Define the main schema for withdrawal
const WithdrawalSchema = new Schema(
  {
    userId: {
      type: String,
      required: false, // Optional field
    },
    bankDetails: {
      type: BankDetailsSchema,
      required: false, // Optional field
    },
    documentUpload: {
      type: DocumentUploadSchema,
      required: false, // Optional field
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Create and export the Withdrawal model
export const Withdrawal = mongoose.model("Withdrawal", WithdrawalSchema);
