import { asyncHandler } from "../utils/asyncHandler.js";
import { Agent } from "../models/agent.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { StudentInformation } from "../models/studentInformation.model.js";
import { Institution } from "../models/institution.model.js";
import { agentOfferLetterApproved, agentOfferLetterRejected, studentOfferLetterApprovedTemp, studentOfferLetterRejectedTemp } from "../utils/mailTemp.js";
import { sendEmail } from "../utils/sendMail.js";


// Get total agents count
const getTotalAgentsCount = asyncHandler (async (req, res)=>{
    const totalAgent = await Agent.countDocuments({role: 'AGENT'});
    return res.status(200).json(
        new ApiResponse(200, totalAgent, "Agent count got successfully")
    )
});

// Get all students count 
const getTotalStudentCount = asyncHandler(async (req, res)=>{
    const studentCount = await Student.countDocuments();
    return res.status(200).json(
        new ApiResponse(200, studentCount, "Student count got successfully")
    )
});

const changeStudentInformationStatus = asyncHandler(async (req, res) => {
    const { studentInformationId } = req.params; // Assuming studentId is passed as a URL parameter
    const { status, message } = req.body; // Extract status and optional message from the request body

    // Validate that status is provided
    if (!status) {
        return res.status(400).json(
            new ApiResponse(400, {}, "status is required")
        );
    }

    // Find the student information by studentId
    const studentInfo = await StudentInformation.findOne({ _id:studentInformationId });
    if (!studentInfo) {
        return res.status(404).json(
            new ApiResponse(404, {}, "Student information not found")
        );
    }

    // Update the status and message
    studentInfo.pageStatus.status = status;
    if (message) {
        studentInfo.pageStatus.message = message; // Update message if provided
    }

    // Save the updated student information
    await studentInfo.save();

    // Respond with a success message
    return res.status(200).json(
        new ApiResponse(200, { studentInfo }, "Student information status updated successfully")
    );
});

export const getAllApplications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Calculate the number of documents to skip for pagination
    const skip = (page - 1) * limit;

    // Initialize the query object (without user-specific filter)
    const query = {};

    // Create an array to hold the $or conditions
    const orConditions = [];

    // Add filters for offerLetter if they are provided
    if (req.query.applicationId) {
        query.applicationId = req.query.applicationId;
    }
    if (req.query.fullName) {
        // Add condition for fullName in both offerLetter and gic using $or
        orConditions.push(
            { 'offerLetter.personalInformation.fullName': { $regex: req.query.fullName, $options: 'i' } },
            { 'gic.personalDetails.fullName': { $regex: req.query.fullName, $options: 'i' } }
        );
    }
    if (req.query.phoneNumber) {
        // Add condition for phoneNumber in both offerLetter and gic using $or
        orConditions.push(
            { 'offerLetter.personalInformation.phoneNumber': req.query.phoneNumber },
            { 'gic.personalDetails.phoneNumber': req.query.phoneNumber }
        );
    }
    if (req.query.institution) {
        // Add institution filter for offerLetter
        query['offerLetter.preferences.institution'] = { $regex: req.query.institution, $options: 'i' };
    }
    if (req.query.country) {
        // Add country filter for offerLetter
        query['offerLetter.preferences.country'] = { $regex: req.query.country, $options: 'i' };
    }

    // Add status filter if provided
    if (req.query.status) {
        // Allow multiple status values using $in
        const validStatuses = ['underreview', 'completed', 'reject', 'pending', 'approved'];
        if (validStatuses.includes(req.query.status)) {
            query.$or = [
                { 'offerLetter.status': req.query.status },
                { 'gic.status': req.query.status }
            ];
        } else {
            return res.status(400).json(new ApiResponse(400, {}, "Invalid status filter provided."));
        }
    }

    // Add filter for specific application types
    if (req.query.filterType) {
        switch (req.query.filterType.toLowerCase()) {
            case 'offerletter':
                query['offerLetter'] = { $exists: true };
                break;
            case 'coursefeeapplication':
                query['courseFeeApplication'] = { $exists: true };
                break;
            case 'visa':
                query['gic'] = { $exists: true };
                break;
            case 'all':
                // No additional filter, retrieve all types
                break;
            default:
                return res.status(400).json(new ApiResponse(400, {}, "Invalid filter type provided."));
        }
    }

    // If there are any OR conditions, merge them with the main query using $or
    if (orConditions.length > 0) {
        query.$or = orConditions;
    }

    // Fetch paginated applications with the applied filters
    const applications = await Institution.find(query)
        .select("-__v") // Exclude __v field
        .skip(skip)
        .limit(limit)
        .exec();

    // Get the total number of matching applications for pagination
    const totalApplications = await Institution.countDocuments(query);

    // Transform applications to include specific fields
    const transformedApplications = applications.map(app => ({
        applicationId: app.applicationId,
        userId: app.userId,
        offerLetter: app.offerLetter,
        gic: app.gic,
        courseFeeApplication: app.courseFeeApplication,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
    }));

    // Return a success response with paginated data
    return res.status(200).json(
        new ApiResponse(200, {
            applications: transformedApplications,
            currentPage: page,
            totalPages: Math.ceil(totalApplications / limit),
            totalApplications,
        }, "Data fetched successfully")
    );
});

const changeApplicationStatus = asyncHandler(async (req, res) => {
    const { institutionId } = req.params; 
    const { section, status, message } = req.body;

    // Validate required fields
    if (!section || !status) {
        return res.status(400).json(
            new ApiResponse(400, {}, "Both section and status are required")
        );
    }

    // Find the institution
    const institution = await Institution.findOne({ _id: institutionId }).populate('studentInformationId');
    if (!institution) {
        return res.status(404).json(
            new ApiResponse(404, {}, "Institution not found")
        );
    }
    const userId = institution.userId;
    // const findStudent = await Student.findOne({_id: userId}) ;
    const findAgent  = await Agent.findOne({_id: userId});
    // Retrieve student's information
    const studentInfo = await StudentInformation.findOne({ _id: institution.studentInformationId });
    if (!studentInfo) {
        return res.status(404).json(
            new ApiResponse(404, {}, "Student information not found")
        );
    }

    const { firstName, email } = studentInfo.personalInformation;
    const { country, course } = institution.offerLetter.preferences;
    const collegeName = institution.offerLetter.preferences.institution; // Assuming this is the correct field for college name

    // Update the status for the specified section
    if (section === 'offerLetter') {

        if(status == 'approved'){
        institution.offerLetter.status = status;
        if (message) {
            institution.offerLetter.message = message;
        }
        const temp = studentOfferLetterApprovedTemp(firstName, collegeName, country, course);
        await sendEmail({to:email, subject:"Your Offer Letter is Approved Proceed with Payment", htmlContent:temp })
        if(findAgent){
            const temp = agentOfferLetterApproved(findAgent.accountDetails.primaryContactPerson.name, studentName, collegeName, country, course);
            await sendEmail({to:findAgent.accountDetails.founderOrCeo.email, subject:`Offer Letter Approved for ${studentName} Proceed with Next Steps`, htmlContent:temp }) 
        } 
    } else if(status == 'rejected'){
        institution.offerLetter.status = status;
        if (message) {
            institution.offerLetter.message = message;
        }
        const temp = studentOfferLetterRejectedTemp(firstName,collegeName, country, course, message);
        await sendEmail({to:email, subject:"Your Offer Letter is Approved Proceed with Payment", htmlContent:temp })
        if(findAgent){
            const temp = agentOfferLetterRejected(findAgent.accountDetails.primaryContactPerson.name, studentName, collegeName, country, course,message );
            await sendEmail({to:findAgent.accountDetails.founderOrCeo.email, subject:`Offer Letter Rejected for ${studentName} Action Required`, htmlContent:temp }) 
        } 
    }
       
    } else if (section === 'gic') {
        institution.gic.status = status;
        if (message) {
            institution.gic.message = message;
        }
    } else {
        return res.status(400).json(
            new ApiResponse(400, {}, "Invalid section provided")
        );
    }

    // Save the updated institution data
    await institution.save();

    // Return success response
    return res.status(200).json(
        new ApiResponse(200, { institution }, `${section} status updated successfully`)
    );
});


const getTotalApplicationCount = asyncHandler(async(req, res)=>{
    const totalCount = await Institution.countDocuments({
        $or: [
            { "offerLetter.type": "offerLetter" },
            { "gic.type": "GIC" }
        ]
    });

    // Pending count for both offerLetter and gic
    const pendingCount = await Institution.countDocuments({
        $or: [
            { "offerLetter.status": "pending" },
            { "gic.status": "pending" }
        ]
    });

    // Approved count for both offerLetter and gic
    const approvedCount = await Institution.countDocuments({
        $or: [
            { "offerLetter.status": "approved" },
            { "gic.status": "approved" }
        ]
    });

    // Send response with the counts
    
    return res.status(200).json(new ApiResponse({
        statusCode: 200,
        totalCount: totalCount,
        pendingCount: pendingCount,
        approvedCount: approvedCount,
        message: "Application counts retrieved successfully"
    }));
})


const getTotalTicketCount = asyncHandler(async(req, res)=>{
    const totalCount = await Ticket.countDocuments();

    const pendingCount = await Ticket.countDocuments({ status: "underReview" });

    const approvedCount = await Ticket.countDocuments({ status: "approved" });
      
    return res.status(200).json(new ApiResponse({
        statusCode: 200,
        totalCount,
        pendingCount,
        approvedCount,
        message: "Ticket counts retrieved successfully"
    }));
})

const getTotalUserCount = asyncHandler(async(req, res)=>{
    const { year } = req.query;

    let dateFilter = {};
    if (year) {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      
      dateFilter = {
        createdAt: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
    }

    const studentCount = await Student.countDocuments(dateFilter);
    
    const agentCount = await Agent.countDocuments(dateFilter);

    const totalUserCount = studentCount + agentCount;

    return res.status(200).json(new ApiResponse({
      statusCode: 200,
      totalUserCount,
      studentCount,
      agentCount,
      message: `User counts retrieved successfully for the year ${year || 'all years'}`,
    }));
});

const getAllAgentData = asyncHandler(async(req, res)=>{
const { page = 1, limit = 10, pageStatus } = req.query;

  // Build query to filter by pageStatus if provided
  const query = {};
  
  // Filter by pageStatus if provided in query
  if (pageStatus) {
    query['pageStatus.status'] = pageStatus;
  }

  // Fetch companies with pagination
  const companies = await Company.find(query)
    .skip((parseInt(page) - 1) * parseInt(limit))  // Skip based on the current page
    .limit(parseInt(limit))  // Limit the number of records per page
    .select("-__v");  // Exclude version field if not needed

  // Get total count for pagination calculation
  const totalCompanies = await Company.countDocuments(query);

  // Check if any companies match the query
  if (!companies.length) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "No companies found matching the criteria"));
  }

  // Prepare pagination data
  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalCompanies / limit),
    pageSize: parseInt(limit),
    totalItems: totalCompanies,
  };

  // Respond with the results and pagination info
  return res
    .status(200)
    .json(new ApiResponse(200, { companies, pagination }, "Companies fetched successfully"));
});

const getAllStudentData = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, pageStatus } = req.query;
  
    // Build query to filter by pageStatus if provided
    const query = {};
  
    // Filter by pageStatus if provided in query
    if (pageStatus) {
      query["pageStatus.status"] = pageStatus;
    }
  
    // Fetch students with pagination
    const students = await StudentInformation.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))  // Skip based on the current page
      .limit(parseInt(limit))  // Limit the number of records per page
  
    // Get total count for pagination calculation
    const totalStudents = await StudentInformation.countDocuments(query);
  
    // Check if any students match the query
    if (!students.length) {
      return res
        .status(404)
        .json({
          statusCode: 404,
          data: {},
          message: "No students found matching the criteria",
        });
    }
  
    // Prepare pagination data
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalStudents / limit),
      pageSize: parseInt(limit),
      totalItems: totalStudents,
    };
  
    // Respond with the results and pagination info
    return res
      .status(200)
      .json({
        statusCode: 200,
        data: { students, pagination },
        message: "Students fetched successfully",
      });
  });
  

    
export {getTotalAgentsCount, getTotalStudentCount, changeStudentInformationStatus, changeApplicationStatus, getTotalApplicationCount, getTotalTicketCount, getTotalUserCount, getAllAgentData, getAllStudentData}