import { Student } from "../models/student.model.js";
import { StudentInformation } from "../models/studentInformation.model.js";
import { Ticket } from "../models/ticket.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createTicketSchema, updateTicketStatusSchema } from "../validators/ticket.validator.js";


async function generateTicketId() {
    const today = new Date();
  
    // Format the date components (DDMMYY)
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(2);
  
    // Construct the base Ticket ID without the sequence number
    const baseId = `TK-${year}${month}${day}`;
  
    // Find the last created ticket with a matching date prefix (e.g., T-240926)
    const lastTicket = await Ticket
      .findOne({ ticketId: { $regex: `^${baseId}` } })  // Search for existing IDs with the same base
      .sort({ ticketId: -1 })  // Sort by descending order to get the last created one
      .exec();
  
    let sequenceNumber = 1;  // Default sequence number
  
    if (lastTicket) {
      // Extract the last two digits (sequence number) from the last ticketId
      const lastId = lastTicket.ticketId;
      const lastSequence = parseInt(lastId.slice(-2), 10);  // Get the last 2 digits of the ticketId
      
      // Increment the sequence number for the new ID
      sequenceNumber = lastSequence + 1;
    }
  
    // Format the sequence number as a two-digit number
    const sequenceStr = sequenceNumber.toString().padStart(2, '0');
  
    // Return the unique Ticket ID (e.g., T-24092601)
    return `${baseId}${sequenceStr}`;
}


export const createTicket = asyncHandler(async (req, res) => {
    const { body: payload } = req;

    // Validate the payload using Zod schema
    const validation = createTicketSchema.safeParse(payload);
    if (!validation.success) {
        return res.status(400).json(new ApiResponse(400, {}, validation.error.errors));
    }

    // Check if the student exists
    const studentId = await Student.findById(req.user.id);
    const student = await StudentInformation.findOne({studentId: studentId._id});
     
    if (!student) {
        return res.status(404).json(new ApiResponse(404, {}, "Student not found"));
    }

    // Calculate payment for urgent priority
    const payment = payload.priorityStatus === 'Urgent' ? 12 : 0;

    // Create a new ticket
    const ticketId = await generateTicketId();
    const newTicket = await Ticket.create({
        studentId: student.studentId,
        ticketType: payload.ticketType,
        priorityStatus: payload.priorityStatus,
        description: payload.description,
        payment,
        ticketId: ticketId,
        createdBy: req.user.id
    });

    // Return success response with the created ticket excluding the __v field
    const createdTicket = await Ticket.findById(newTicket._id).select('-__v').exec();

    return res.status(201).json(new ApiResponse(201, createdTicket, "Ticket created successfully"));
});

export const getTicketById = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({ _id: ticketId }).select('-__v').exec();

    if (!ticket) {
        return res.status(404).json(new ApiResponse(404, {}, "Ticket not found"));
    }

    return res.status(200).json(new ApiResponse(200, ticket, "Ticket fetched successfully"));
});

export const getAllTickets = asyncHandler(async (req, res) => {
    // Extract query parameters from the request
    const { page = '1', limit = '10', priorityStatus, status } = req.query;

    // Validate query params using Zod
    // const validation = getAllTicketsSchema.safeParse({ page, limit, priorityStatus, status });
    // if (!validation.success) {
    //     return res.status(400).json(new ApiResponse(400, {}, validation.error.errors));
    // }

    // Convert page and limit to numbers for pagination
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Build a query object for filtering based on priorityStatus and status
    const query = {};
    if (priorityStatus) {
        query.priorityStatus = priorityStatus;
    }
    if (status) {
        query.status = status;
    }

    // Fetch tickets with pagination and filtering
    const tickets = await Ticket.find(query)
        .select('-__v') // Exclude the __v field
        .skip((pageNumber - 1) * limitNumber) // Skip documents for pagination
        .limit(limitNumber) // Limit number of documents per page
        .exec();

    if (!tickets || tickets.length === 0) {
        return res.status(404).json(new ApiResponse(404, {}, "No tickets found"));
    }

    // Count total number of tickets for pagination metadata
    const totalTickets = await Ticket.countDocuments(query);

    // Return success response with tickets and pagination metadata
    return res.status(200).json(new ApiResponse(200, {
        tickets,
        totalTickets,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalTickets / limitNumber),
    }, "Tickets fetched successfully"));
});

export const updateTicketStatus = asyncHandler(async(req, res)=>{
    const { ticketId } = req.params;
    const { status } = req.body;

    // Validate the status using Zod schema
    const validation = updateTicketStatusSchema.safeParse({ status });
    if (!validation.success) {
        return res.status(400).json(new ApiResponse(400, {}, validation.error.errors));
    }

    // Find the ticket by ticketId
    const ticket = await Ticket.findOne({ _id: ticketId });

    if (!ticket) {
        return res.status(404).json(new ApiResponse(404, {}, "Ticket not found"));
    }

    // Update the status of the ticket
    ticket.status = status;
    await ticket.save();

    // Return success response with the updated ticket
    return res.status(200).json(new ApiResponse(200, ticket, "Ticket status updated successfully"));
});
export const getMyTickets = asyncHandler(async(req, res)=>{
    const ticket = await Ticket.findOne({ createdBy: req.user.id });
    if(!ticket){
        return res.status(404).json(
            new ApiResponse(404, {}, "Ticket not found")
        )
    }

    return res.status(200).json(new ApiResponse(200, ticket, "Ticket got successfully"));
})



