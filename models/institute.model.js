import mongoose, { Schema } from "mongoose";

// Institute Schema
const InstituteSchema = new Schema({
  instituteName: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,  // Automatically add createdAt and updatedAt fields
});

// Create Institute model
export const Institute = mongoose.model("Institute", InstituteSchema);
