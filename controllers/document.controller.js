import { Document } from "../models/document.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { DocumentUploadSchema } from "../validators/document.validator.js";



const uploadDocument = asyncHandler(async (req, res) => {
    const { body: payload } = req;

    // Validate the payload using Zod schema
    const validation = DocumentUploadSchema.safeParse(payload);
    if (!validation.success) {
        return res.status(400).json(new ApiResponse(400, {}, validation.error.errors));
    }

    // Assuming user ID is provided in the request
    const userId = req.user.id;

    // Create a new document
    const newDocument = await Document.create({
        documentName: payload.documentName,
        viewUrl: payload.viewUrl,
        userId: userId  // Assign the userId from the authenticated user
    });

    // Return success response with the created document excluding the __v field
    const createdDocument = await Document.findById(newDocument._id).select('-__v').exec();

    return res.status(201).json(new ApiResponse(201, createdDocument, "Document uploaded successfully"));
});

const getAllDocuments = asyncHandler(async (req, res) => {
// Assuming userId is passed as a route parameter

    // Fetch all documents for the given userId
    const documents = await Document.find({ userId: req.user.id });

    // Check if documents were found
    if (documents.length === 0) {
        return res.status(404).json(new ApiResponse(404, {}, "No documents found for this user"));
    }

    // Return success response with the list of documents
    return res.status(200).json(new ApiResponse(200, documents, "Documents retrieved successfully"));
});

const getSingleDocument = asyncHandler(async (req, res) => {
    const { id } = req.params; // Get the document ID from the request parameters

    // Find the document by ID
    const document = await Document.findById(id);

    // Check if the document was found
    if (!document) {
        return res.status(404).json(new ApiResponse(404, {}, "Document not found"));
    }

    // Return success response with the document
    return res.status(200).json(new ApiResponse(200, document, "Document retrieved successfully"));
});

const deleteDocument = asyncHandler(async (req, res) => {
    const { id } = req.params; // Get the document ID from the request parameters

    // Find the document by ID and delete it
    const deletedDocument = await Document.findByIdAndDelete(id);

    // Check if the document was found and deleted
    if (!deletedDocument) {
        return res.status(404).json(new ApiResponse(404, {}, "Document not found"));
    }

    // Return success response
    return res.status(200).json(new ApiResponse(200, {}, "Document deleted successfully"));
});

export {uploadDocument, getAllDocuments, getSingleDocument, deleteDocument}