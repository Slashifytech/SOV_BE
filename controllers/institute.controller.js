import { Institute } from "../models/institute.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllInstitute = asyncHandler(async (req, res) => {
    const { country } = req.params;

    // Fetch all institutes from the database that match the specified country
    const institutes = await Institute.find({ country }); // Adjust the query based on your schema

    // Check if institutes exist
    if (!institutes || institutes.length === 0) {
        return res.status(404).json(new ApiResponse(404, {}, "No institutes found"));
    }

    // Return the institutes data
    return res.status(200).json(new ApiResponse(200, institutes, "Institutes fetched successfully"));
});

export { getAllInstitute };
