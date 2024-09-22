import mongoose, { Schema } from "mongoose";

// Country Schema
const CountrySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Ensure no duplicate country names
  },
}, {
  timestamps: true,  // Automatically add createdAt and updatedAt fields
});

// Create Country model
export const Country = mongoose.model("Country", CountrySchema);