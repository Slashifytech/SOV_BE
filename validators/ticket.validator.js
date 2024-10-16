import { z } from "zod";

// Zod validation schema for Ticket
export const createTicketSchema = z.object({
  ticketType: z.enum(['General', 'Technical', 'Financial'], { message: "Invalid ticket type." }),  // Must be one of these values
  priorityStatus: z.enum(['Normal', 'Urgent'], { message: "Invalid priority status." }),  // Must be 'Normal' or 'Urgent'
  description: z.string().min(1, { message: "Description is required." }),  // Non-empty string
  payment: z.number().min(0, { message: "Payment must be a non-negative number." }).optional(),  // Optional, default is 0
  status: z.string().optional(),  // Optional field for status
});