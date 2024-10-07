import { Institute } from "../models/institute.model.js"; // Adjust the import based on your project structure
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all institutes with filtering and sorting
const getAllInstitute = asyncHandler(async (req, res) => {
    const { instituteName, country, sortOrder = 'asc' } = req.query; // Use req.query for query parameters

    // Build the query object based on filters
    const query = {};
    if (instituteName) {
        query.instituteName = new RegExp(instituteName, "i"); // Case-insensitive search
    }
    if (country) {
        query.country = new RegExp(country, "i"); // Case-insensitive search
    }

    // Fetch all institutes from the database that match the specified filters
    const institutes = await Institute.find(query).sort({ createdAt: sortOrder === 'desc' ? -1 : 1 }).exec();

    // Check if institutes exist
    if (!institutes || institutes.length === 0) {
        return res.status(404).json(new ApiResponse(404, {}, "No institutes found"));
    }

    // Return the institutes data
    return res.status(200).json(new ApiResponse(200, institutes, "Institutes fetched successfully"));
});

export { getAllInstitute };
