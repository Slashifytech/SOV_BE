import { Institution } from "../models/institution.model.js";
import { StudentInformation } from "../models/studentInformation.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



export const getTotalStudentCount = asyncHandler(async (req, res) => {
    // Ensure the user is an agent (assuming role '2' is for agents)
    if (req.user.role !== '2') {
      return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to view student information"));
    }
  
    // Optional year filter from query parameters
    const { year } = req.query;
  
    let dateFilter = {};
    
    if (year) {
      // If year is provided, set date range for that year (start of the year to end of the year)
      const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59Z`);
      dateFilter.createdAt = { $gte: startOfYear, $lte: endOfYear };
    } else {
      // Calculate the date 7 days ago if no year is provided
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter.createdAt = { $gte: sevenDaysAgo };
    }
  
    // Get total student records for the agent
    const totalRecords = await StudentInformation.countDocuments({
      agentId: req.user.id
    });
  
    // Get student records inserted in the last 7 days or the specified year
    const insertedRecords = await StudentInformation.countDocuments({
      agentId: req.user.id,
      ...dateFilter
    });
  
    // Calculate the percentage increase in the last 7 days or the specified year
    const insertionPercentage = totalRecords > 0 
      ? ((insertedRecords / totalRecords) * 100).toFixed(2) 
      : 0;
  
    // Return the total count and the percentage of recent additions
    return res.status(200).json(new ApiResponse(200, { 
      totalRecords, 
      insertedRecords, 
      insertionPercentage 
    }, `Percentage of students added ${year ? `in the year ${year}` : 'in the last 7 days'} fetched successfully`));
  });


  export const getTotalApplicationCount = asyncHandler(async (req, res) => {
    // Ensure the user is authorized (assuming role 'user' is role '2' for agents)
    if (req.user.role !== '2') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to view this information"));
    }

    // Optional year filter from query parameters
    const { year } = req.query;

    let dateFilter = {};

    if (year) {
        // If year is provided, set date range for that year (start of the year to end of the year)
        const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
        const endOfYear = new Date(`${year}-12-31T23:59:59Z`);
        dateFilter.createdAt = { $gte: startOfYear, $lte: endOfYear };
    } else {
        // Calculate the date 7 days ago if no year is provided
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        dateFilter.createdAt = { $gte: sevenDaysAgo };
    }

    // Query to get the total count of applications for the logged-in user (agent)
    const totalRecords = await Institution.countDocuments({
        userId: req.user.id,
    });

    // Query to get the count of applications inserted in the last 7 days or the specified year
    const insertedRecords = await Institution.countDocuments({
        userId: req.user.id,
        ...dateFilter,
    });

    // Calculate the percentage increase in the last 7 days or the specified year
    const insertionPercentage = totalRecords > 0
        ? ((insertedRecords / totalRecords) * 100).toFixed(2)
        : 0;

    // Return the total count and the percentage of recent additions
    return res.status(200).json(new ApiResponse(200, {
        totalRecords,
        insertedRecords,
        insertionPercentage
    }, `Percentage of applications added ${year ? `in the year ${year}` : 'in the last 7 days'} fetched successfully`));
});


export const getTotalUnderReviewCount = asyncHandler(async (req, res) => {
    // Ensure the user is authorized (assuming role '2' is for agents)
    if (req.user.role !== '2') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to view this information"));
    }

    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Query to get the total count of "under review" applications for the logged-in user (agent)
    // We need to check both `offerLetter.status` and `gic.status` for "under review"
    const totalUnderReview = await Institution.countDocuments({
        userId: req.user.id,
        $or: [
            { 'offerLetter.status': 'underreview' },
            { 'gic.status': 'underreview' }
        ]
    });

    // Query to get the count of "under review" applications inserted in the last 7 days
    const recentUnderReview = await Institution.countDocuments({
        userId: req.user.id,
        $or: [
            { 'offerLetter.status': 'underreview' },
            { 'gic.status': 'underreview' }
        ],
        createdAt: { $gte: sevenDaysAgo }
    });

    // Calculate the percentage of "under review" applications in the last 7 days
    const underReviewPercentage = totalUnderReview > 0 
        ? ((recentUnderReview / totalUnderReview) * 100).toFixed(2) 
        : 0;

    // Return the total "under review" count and the percentage of recent additions
    return res.status(200).json(new ApiResponse(200, {
        totalUnderReview,
        recentUnderReview,
        underReviewPercentage,
    }, `Percentage of under review applications in the last 7 days fetched successfully`));
});


export const getTotalCompletedCount = asyncHandler(async (req, res) => {
    // Ensure the user is authorized (assuming role '2' is for agents)
    if (req.user.role !== '2') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to view this information"));
    }

    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Query to get the total count of "completed" applications for the logged-in user (agent)
    // We need to check both `offerLetter.status` and `gic.status` for "completed"
    const totalCompleted = await Institution.countDocuments({
        userId: req.user.id,
        $or: [
            { 'offerLetter.status': 'completed' },  // Assuming 'success' indicates completion
            { 'gic.status': 'completed' }
        ]
    });

    // Query to get the count of "completed" applications inserted in the last 7 days
    const recentCompleted = await Institution.countDocuments({
        userId: req.user.id,
        $or: [
            { 'offerLetter.status': 'completed' },
            { 'gic.status': 'completed' }
        ],
        createdAt: { $gte: sevenDaysAgo }
    });

    // Calculate the percentage of "completed" applications in the last 7 days
    const completedPercentage = totalCompleted > 0 
        ? ((recentCompleted / totalCompleted) * 100).toFixed(2) 
        : 0;

    // Return the total "completed" count and the percentage of recent additions
    return res.status(200).json(new ApiResponse(200, {
        totalCompleted,
        recentCompleted,
        completedPercentage,
    }, `Percentage of completed applications in the last 7 days fetched successfully`));
});
  

