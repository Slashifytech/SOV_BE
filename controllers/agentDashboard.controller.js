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
    let dateRangeMessage = "in the last 7 days"; // Default message
  
    if (year) {
      // If year is provided, set date range for that year (start of the year to end of the year)
      const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59Z`);
      dateFilter.createdAt = { $gte: startOfYear, $lte: endOfYear };
      dateRangeMessage = `in the year ${year}`;
    } else {
      // Calculate the date 7 days ago if no year is provided
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter.createdAt = { $gte: sevenDaysAgo };
  
      // Calculate the date range 7 days before the last 7 days (for previous count)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
      // Count student records before the last 7 days
      const previousRecordCount = await StudentInformation.countDocuments({
        agentId: req.user.id,
        createdAt: { $lt: sevenDaysAgo }
      });
  
      // Get the count of new records added in the last 7 days
      const insertedRecords = await StudentInformation.countDocuments({
        agentId: req.user.id,
        ...dateFilter
      });
  
      // Calculate the percentage increase relative to the previous period
      const percentageIncrease = previousRecordCount > 0
        ? (((insertedRecords - previousRecordCount) / previousRecordCount) * 100).toFixed(2)
        : (insertedRecords > 0 ? 100 : 0); // If there were no previous records, it's a 100% increase if new records exist
  
      return res.status(200).json(new ApiResponse(200, {
        previousRecordCount,
        insertedRecords,
        percentageIncrease
      }, `Student record count ${dateRangeMessage} fetched successfully`));
    }
  
    // Get the total student records for the agent
    const totalRecords = await StudentInformation.countDocuments({
      agentId: req.user.id
    });
  
    // Return the total count and a default 0% increase for the year filter
    return res.status(200).json(new ApiResponse(200, {
      totalRecords,
      insertedRecords: 0,
      percentageIncrease: 0
    }, `Total student records ${dateRangeMessage} fetched successfully`));
  });


  export const getTotalApplicationCount = asyncHandler(async (req, res) => {
    // Ensure the user is authorized (assuming role 'user' is role '2' for agents)
    if (req.user.role !== '2') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to view this information"));
    }

    const { year } = req.query;
    let dateFilter = {};
    let previousPeriodFilter = {};

    if (year) {
        // If a year is provided, calculate the date range for that year
        const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
        const endOfYear = new Date(`${year}-12-31T23:59:59Z`);
        dateFilter.createdAt = { $gte: startOfYear, $lte: endOfYear };

        // Filter for records before the start of the year
        previousPeriodFilter.createdAt = { $lt: startOfYear };
    } else {
        // Calculate the date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Filter for records in the last 7 days
        dateFilter.createdAt = { $gte: sevenDaysAgo };

        // Filter for records before the last 7 days
        previousPeriodFilter.createdAt = { $lt: sevenDaysAgo };
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

    // Query to get the count of records before the last 7 days or the specified year
    const previousRecordCount = await Institution.countDocuments({
        userId: req.user.id,
        ...previousPeriodFilter,
    });

    // Calculate the percentage increase (if previousRecordCount > 0)
    let percentageIncrease = 0;
    if (previousRecordCount > 0) {
        percentageIncrease = ((insertedRecords / previousRecordCount) * 100).toFixed(2);
    } else if (insertedRecords > 0) {
        // If there were no records previously, but new records are added, the increase is 100%
        percentageIncrease = 100;
    }

    // Return the total count, the inserted records, and the percentage increase
    return res.status(200).json(new ApiResponse(200, {
        previousRecordCount,
        insertedRecords,
        percentageIncrease
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
    const totalUnderReview = await Institution.countDocuments({
        userId: req.user.id,
        $or: [
            { 'offerLetter.status': 'underreview' },
            { 'gic.status': 'underreview' }
        ]
    });

    // Query to get the count of "under review" applications inserted before 7 days ago
    const previousUnderReview = await Institution.countDocuments({
        userId: req.user.id,
        $or: [
            { 'offerLetter.status': 'underreview' },
            { 'gic.status': 'underreview' }
        ],
        createdAt: { $lt: sevenDaysAgo }
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

    // Calculate the percentage increase in "under review" applications in the last 7 days
    const underReviewPercentage = previousUnderReview > 0
        ? (((recentUnderReview - previousUnderReview) / previousUnderReview) * 100).toFixed(2)
        : recentUnderReview > 0 ? 100 : 0;  // If no previous data and new entries exist, consider it 100% increase

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
    const totalCompleted = await Institution.countDocuments({
        userId: req.user.id,
        $or: [
            { 'offerLetter.status': 'completed' },  
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

    // Query to get the count of "completed" applications before 7 days ago
    const pastCompleted = await Institution.countDocuments({
        userId: req.user.id,
        $or: [
            { 'offerLetter.status': 'completed' },
            { 'gic.status': 'completed' }
        ],
        createdAt: { $lt: sevenDaysAgo }
    });

    // Calculate the percentage increase in "completed" applications in the last 7 days
    const totalBefore = totalCompleted - recentCompleted;
    const increasePercentage = totalBefore > 0
        ? ((recentCompleted / totalBefore) * 100).toFixed(2)
        : recentCompleted > 0 ? 100 : 0;  // If totalBefore is 0 but recentCompleted is not, set 100% increase

    // Return the total "completed" count, the recent count, and the increase percentage
    return res.status(200).json(new ApiResponse(200, {
        totalCompleted,
        recentCompleted,
        increasePercentage,
    }, `Percentage of completed applications in the last 7 days fetched successfully`));
});;
  

