import { asyncHandler } from "../utils/asyncHandler.js";
import { Agent } from "../models/agent.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { StudentInformation } from "../models/studentInformation.model.js";
import { Institution } from "../models/institution.model.js";
import { agentOfferLetterApproved, agentOfferLetterRejected, studentOfferLetterApprovedTemp, studentOfferLetterRejectedTemp } from "../utils/mailTemp.js";
import { sendEmail } from "../utils/sendMail.js";
import { Company } from "../models/company.model.js";

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
    const skip = (page - 1) * limit;
    const query = {};
    const orConditions = [];

    // Filtering by applicationId if provided
    if (req.query.applicationId) {
        query.applicationId = req.query.applicationId;
    }

    // Filtering by fullName if provided
    if (req.query.fullName) {
        orConditions.push(
            { 'offerLetter.personalInformation.fullName': { $regex: req.query.fullName, $options: 'i' } },
            { 'gic.personalDetails.fullName': { $regex: req.query.fullName, $options: 'i' } }
        );
    }

    // Filtering by phoneNumber if provided
    if (req.query.phoneNumber) {
        orConditions.push(
            { 'offerLetter.personalInformation.phoneNumber': req.query.phoneNumber },
            { 'gic.personalDetails.phoneNumber': req.query.phoneNumber }
        );
    }

    // Filtering by institution if provided
    if (req.query.institution) {
        query['offerLetter.preferences.institution'] = { $regex: req.query.institution, $options: 'i' };
    }

    // Filtering by country if provided
    if (req.query.country) {
        query['offerLetter.preferences.country'] = { $regex: req.query.country, $options: 'i' };
    }

    // Filtering by status
    if (req.query.status) {
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

    // Filtering by application type (offerLetter, gic, etc.)
    if (req.query.filterType) {
        switch (req.query.filterType.toLowerCase()) {
            case 'offerletter':
                query['offerLetter'] = { $exists: true };
                break;
            case 'gic':
                query['gic'] = { $exists: true };
                break;
            case 'all':
                // No additional filtering for all
                break;
            default:
                return res.status(400).json(new ApiResponse(400, {}, "Invalid filter type provided."));
        }
    }

    if (orConditions.length > 0) {
        query.$or = orConditions;
    }

    // Fetch paginated applications with applied filters
    const applications = await Institution.find(query)
        .select("-__v") // Exclude __v field
        .skip(skip)
        .limit(limit)
        .exec();

    // Get the total number of matching applications for pagination
    const totalApplications = await Institution.countDocuments(query);

    // Transform applications to include userType, userId (stId or agId), and application type
    const transformedApplications = applications.map(app => {
        let userType = app.stId ? 'student' : 'agent';
        let userId = app.stId || app.agId;
        let applicationType = app.offerLetter ? 'offerLetter' : (app.gic ? 'gic' : 'unknown');

        return {
            applicationId: app.applicationId,
            userId: userId,
            userType: userType,
            applicationType: applicationType,
            offerLetter: app.offerLetter,
            gic: app.gic,
            status: app.offerLetter?.status || app.gic?.status,
        };
    });

    // Pagination logic
    const totalPages = Math.ceil(totalApplications / limit);
    const currentPage = page;
    const previousPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;
    const hasPreviousPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;

    // Respond with paginated applications and metadata
    res.status(200).json({
        total: totalApplications,
        currentPage,
        previousPage,
        nextPage,
        totalPages,
        limit,
        hasPreviousPage,
        hasNextPage,
        applications: transformedApplications,
    });
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

const getAllDataAgentStudent = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, pageStatus, type } = req.query;

    // Build query to filter by pageStatus if provided
    let query = {};
    if (pageStatus) {
        query["pageStatus.status"] = pageStatus;
    }

    // Define a function to fetch data with pagination
    const fetchDataWithPagination = async (model, query) => {
        const data = await model
            .find(query)
            .skip((parseInt(page) - 1) * parseInt(limit)) // Skip based on the current page
            .limit(parseInt(limit)) // Limit the number of records per page
            .select("-__v"); // Exclude version field if not needed
        
        const totalData = await model.countDocuments(query); // Get total count for pagination

        const totalPages = Math.ceil(totalData / limit);
        const hasPreviousPage = page > 1;
        const hasNextPage = page < totalPages;

        return { data, totalData, totalPages, hasPreviousPage, hasNextPage };
    };

    // Case when 'type' is either 'agent' or 'student'
    if (type === "agent" || type === "student") {
        let dataModel = type === "agent" ? Company : StudentInformation; // Determine the model based on 'type'
        
        const { data, totalData, totalPages, hasPreviousPage, hasNextPage } = await fetchDataWithPagination(dataModel, query);

        if (!data.length) {
            return res.status(404).json({
                statusCode: 404,
                data: {},
                message: `No ${type}s found matching the criteria`,
            });
        }

        const pagination = {
            currentPage: parseInt(page),
            previousPage: hasPreviousPage ? parseInt(page) - 1 : null,
            nextPage: hasNextPage ? parseInt(page) + 1 : null,
            hasPreviousPage,
            hasNextPage,
            totalPages,
            pageSize: parseInt(limit),
            totalItems: totalData,
        };

        return res.status(200).json({
            statusCode: 200,
            data: { data, pagination },
            message: `${type.charAt(0).toUpperCase() + type.slice(1)}s fetched successfully`,
        });

    } else if (!type) {
        // Case when 'type' is not provided: Fetch both agent and student data
        const [agentData, studentData] = await Promise.all([
            fetchDataWithPagination(Company, query), // Fetch agent data (company)
            fetchDataWithPagination(StudentInformation, query), // Fetch student data
        ]);

        const combinedData = {
            agents: agentData.data,
            students: studentData.data,
        };

        const pagination = {
            currentPage: parseInt(page),
            previousPage: agentData.hasPreviousPage || studentData.hasPreviousPage ? parseInt(page) - 1 : null,
            nextPage: agentData.hasNextPage || studentData.hasNextPage ? parseInt(page) + 1 : null,
            hasPreviousPage: agentData.hasPreviousPage || studentData.hasPreviousPage,
            hasNextPage: agentData.hasNextPage || studentData.hasNextPage,
            totalPages: Math.max(agentData.totalPages, studentData.totalPages),
            pageSize: parseInt(limit),
            totalAgents: agentData.totalData,
            totalStudents: studentData.totalData,
        };

        return res.status(200).json({
            statusCode: 200,
            data: { combinedData, pagination },
            message: "Agents and students fetched successfully",
        });

    } else {
        // If 'type' is invalid, return an error
        return res.status(400).json({
            statusCode: 400,
            data: {},
            message: "'type' must be either 'agent', 'student', or omitted.",
        });
    }
});

  
  

  const getAgentById = asyncHandler(async (req, res) => {
    // Extract the company ID from the request parameters
    const { id } = req.params;
  
    // Fetch the company data by its ID
    const company = await Company.findById(id);
  
    // If no company is found, return an error
    if (!company) {
      return res.status(404).json(new ApiResponse({
        statusCode: 404,
        message: "Company not found",
      }));
    }
  
    // Return the company data
    return res.status(200).json(new ApiResponse({
        statusCode: 200,
        data: company,
        message: "Company fetched successfully",
      }));
  });

  const getStudentById = asyncHandler(async (req, res) => {
    // Extract the student ID from the request parameters
    const { id } = req.params;
  
    // Fetch the student data by its ID
    const student = await StudentInformation.findById(id);
  
    // If no student is found, return a 404 error
    if (!student) {
      return res.status(404).json(new ApiResponse({
        statusCode: 404,
        message: "Student not found",
      }));
    }
  
    // Return the student data with a 200 status
    return res.status(200).json(new ApiResponse({
        statusCode: 200,
        data: student,
        message: "Student fetched successfully",
      }));
  });
  
  const updatePageStatus = asyncHandler(async (req, res) => {
    const { id } = req.params; // Extracting id from route parameters
    const { status, message, type } = req.body; // Extracting status, message, and type from the request body
  
    // Validate status
    const validStatuses = ['registering', 'inProgress', 'completed', 'pending', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(
        new ApiResponse(400, {}, 'Invalid status value. Valid values are: "registering", "inProgress", "completed", "pending", "rejected".')
      );
    }
  
    // Check the 'type' to determine whether it's a company or student
    let model;
    if (type === "company") {
      model = Company;  // Use the Company model
    } else if (type === "student") {
      model = StudentInformation;  // Use the StudentInformation model
    } else {
      return res.status(400).json(
        new ApiResponse(400, {}, "'type' must be either 'company' or 'student'.")
      );
    }
  
    // Find the document by ID
    const document = await model.findById(id);
    if (!document) {
      return res.status(404).json(
        new ApiResponse(404, {}, `${type.charAt(0).toUpperCase() + type.slice(1)} not found.`)
      );
    }
  
    // Update the pageStatus with the new status and message
    document.pageStatus = {
      status,
      message: message || "",  // Default message to empty string if not provided
    };
  
    // Save the updated document
    await document.save();
  
    // Send success response
    return res.status(200).json(
      new ApiResponse(200, document, `${type.charAt(0).toUpperCase() + type.slice(1)} page status updated successfully.`)
    );
  });
  

    
export {getTotalAgentsCount, getTotalStudentCount, changeStudentInformationStatus, changeApplicationStatus, getTotalApplicationCount, getTotalTicketCount, getTotalUserCount, getAllDataAgentStudent, getAgentById, getStudentById,updatePageStatus}