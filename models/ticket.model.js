import mongoose, { Schema } from "mongoose";

// Ticket Schema
const TicketSchema = new Schema({
  studentId: {
    type: String,  // Assuming studentId is stored as a string (you may want to change this to ObjectId if referencing another collection)
    required: true,  // Ensure studentId is always provided
  },
  ticketType: {
    type: String, 
    enum: ['General', 'Technical', 'Financial'],  // Example types
    required: true,  // ticketType is mandatory
  },
  priorityStatus: {
    type: String,  // Priority (e.g., Urgent, Normal)
    enum: ['Normal', 'Urgent'],  // Urgent requires payment
    default: 'Normal',
  },
  description: {
    type: String, 
    required: true,  // Description is mandatory
  },
  payment: {
    type: Number, 
    default: 0,    // No payment for normal priority
  },
  status: {
    type: String,  // Fix typo from 'types' to 'type'
    default: "under review",  // Default status when the ticket is created
  },
  ticketId: {
    type: String
  },
  createdBy: {
    type: String
  }
}, {
  timestamps: true,  // Automatically manage `createdAt` and `updatedAt`
});

// Create Ticket model
export const Ticket = mongoose.model("Ticket", TicketSchema);
