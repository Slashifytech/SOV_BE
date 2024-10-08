import { StudentInformation } from "../models/studentInformation.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const getTotalApplicationCount = asyncHandler(async(req, res)=>{
    if (req.user.role !== '2') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to view student information"));
    }

    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get total applications in the database
    const totalRecords = await StudentInformation.countDocuments({
        agentId: req.user.id
    });

    // Get total applications inserted in the last 7 days
    const insertedRecordsLast7Days = await StudentInformation.countDocuments({
        agentId: req.user.id,
        createdAt: { $gte: sevenDaysAgo }
    });

    // Calculate the percentage of applications inserted in the last 7 days
    const insertionPercentage = totalRecords > 0 
        ? ((insertedRecordsLast7Days / totalRecords) * 100).toFixed(2) 
        : 0;

    // Return the total count and percentage
    return res.status(200).json(new ApiResponse(200, { 
        totalRecords, 
        insertedRecordsLast7Days, 
        insertionPercentage 
    }, "Percentage of applications inserted in the last 7 days fetched successfully"));
});

const getTotalUnderReviewCount = asyncHandler(async (req, res) => {
    // Ensure the user role is 'AGENT'
    if (req.user.role !== '2') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to view student information"));
    }

    // Get total records where agentId matches req.user.id and pageStatus.status is 'underreview'
    const totalRecords = await StudentInformation.countDocuments({
        agentId: req.user.id,
        "pageStatus.status": "underreview"
    });

    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get total records under review inserted in the last 7 days
    const underReviewLast7Days = await StudentInformation.countDocuments({
        agentId: req.user.id,
        "pageStatus.status": "underreview",
        createdAt: { $gte: sevenDaysAgo }
    });

    // Calculate the percentage of under review applications inserted in the last 7 days
    const underReviewPercentage = totalRecords > 0 
        ? ((underReviewLast7Days / totalRecords) * 100).toFixed(2) 
        : 0;

    // If totalRecords is not found or is null, respond accordingly
    if (totalRecords === null || totalRecords === undefined) {
        return res.status(404).json(new ApiResponse(404, {}, "No records found"));
    }

    // Return the total count and percentage
    return res.status(200).json(new ApiResponse(200, { 
        totalRecords, 
        underReviewLast7Days, 
        underReviewPercentage 
    }, "Total student information records under review fetched successfully"));
});
const getTotalCompletedCount = asyncHandler(async (req, res) => {
    // Ensure the user role is 'AGENT'
    if (req.user.role !== '2') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to view student information"));
    }

    // Get total records where agentId matches req.user.id and pageStatus.status is 'completed'
    const totalRecords = await StudentInformation.countDocuments({
        agentId: req.user.id,
        "pageStatus.status": "completed"
    });

    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get total completed records inserted in the last 7 days
    const completedLast7Days = await StudentInformation.countDocuments({
        agentId: req.user.id,
        "pageStatus.status": "completed",
        createdAt: { $gte: sevenDaysAgo }
    });

    // Calculate the percentage increase or decrease
    const completedPercentageChange = totalRecords > 0 
        ? ((completedLast7Days - totalRecords) / totalRecords * 100).toFixed(2) 
        : 0;

    // If totalRecords is not found or is null, respond accordingly
    if (totalRecords === null || totalRecords === undefined) {
        return res.status(404).json(new ApiResponse(404, {}, "No records found"));
    }

    // Return the total count and percentage change
    return res.status(200).json(new ApiResponse(200, { 
        totalRecords, 
        completedLast7Days, 
        completedPercentageChange 
    }, "Total student information records completed fetched successfully"));
});
  

export{
    getTotalApplicationCount,
    getTotalUnderReviewCount,
    getTotalCompletedCount
}