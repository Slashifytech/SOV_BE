import { asyncHandler } from "../utils/asyncHandler.js";
import { Agent } from "../models/agent.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { StudentInformation } from "../models/studentInformation.model.js";
import { Institution } from "../models/institution.model.js";
import {
  agentOfferLetterApproved,
  agentOfferLetterRejected,
  studentOfferLetterApprovedTemp,
  studentOfferLetterRejectedTemp,
} from "../utils/mailTemp.js";
import { sendEmail } from "../utils/sendMail.js";
import { Company } from "../models/company.model.js";

// Get total agents count
const getTotalAgentsCount = asyncHandler(async (req, res) => {
  const totalAgent = await Agent.countDocuments({ role: "AGENT" });
  return res
    .status(200)
    .json(new ApiResponse(200, totalAgent, "Agent count got successfully"));
});

// Get all students count
const getTotalStudentCount = asyncHandler(async (req, res) => {
  const studentCount = await Student.countDocuments();
  return res
    .status(200)
    .json(new ApiResponse(200, studentCount, "Student count got successfully"));
});

const changeStudentInformationStatus = asyncHandler(async (req, res) => {
  const { studentInformationId } = req.params; // Assuming studentId is passed as a URL parameter
  const { status, message } = req.body; // Extract status and optional message from the request body

  // Validate that status is provided
  if (!status) {
    return res.status(400).json(new ApiResponse(400, {}, "status is required"));
  }

  // Find the student information by studentId
  const studentInfo = await StudentInformation.findOne({
    _id: studentInformationId,
  });
  if (!studentInfo) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "Student information not found"));
  }

  // Update the status and message
  studentInfo.pageStatus.status = status;
  if (message) {
    studentInfo.pageStatus.message = message; // Update message if provided
  }

  // Save the updated student information
  await studentInfo.save();

  // Respond with a success message
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { studentInfo },
        "Student information status updated successfully"
      )
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
      {
        "offerLetter.personalInformation.fullName": {
          $regex: req.query.fullName,
          $options: "i",
        },
      },
      {
        "gic.personalDetails.fullName": {
          $regex: req.query.fullName,
          $options: "i",
        },
      }
    );
  }

  // Filtering by phoneNumber if provided
  if (req.query.phoneNumber) {
    orConditions.push(
      { "offerLetter.personalInformation.phoneNumber": req.query.phoneNumber },
      { "gic.personalDetails.phoneNumber": req.query.phoneNumber }
    );
  }

  // Filtering by institution if provided
  if (req.query.institution) {
    query["offerLetter.preferences.institution"] = {
      $regex: req.query.institution,
      $options: "i",
    };
  }

  // Filtering by country if provided
  if (req.query.country) {
    query["offerLetter.preferences.country"] = {
      $regex: req.query.country,
      $options: "i",
    };
  }

  // Filtering by status
  if (req.query.status) {
    const validStatuses = ["underreview", "completed", "reject", "pending", "approved"];
    if (validStatuses.includes(req.query.status)) {
      query.$or = [
        { "offerLetter.status": req.query.status },
        { "gic.status": req.query.status },
      ];
    } else {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid status filter provided."));
    }
  }

  // Filtering by application type (offerLetter, gic, etc.)
  if (req.query.filterType) {
    switch (req.query.filterType.toLowerCase()) {
      case "offerletter":
        query["offerLetter"] = { $exists: true };
        break;
      case "gic":
        query["gic"] = { $exists: true };
        break;
      case "all":
        // No additional filtering for all
        break;
      default:
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Invalid filter type provided."));
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

  // Transform applications to include only required fields
  const transformedApplications = await Promise.all(
    applications.map(async (app) => {
      const userId = app.studentInformationId || app.userId; // Adjust based on your model structure
      const userType = app.studentInformationId ? "student" : "agent"; // Assuming studentInformationId indicates a student

      // Initialize result object with required fields
      const result = {
        userId,
        userType,
        institutionId: app._id, // Include institution._id
        applicationId: app.applicationId, // Add applicationId
        status: null, // Placeholder for status
        message: null, // Placeholder for message
        agentFirstName: null, // Placeholder for agent's first name
        agentLastName: null, // Placeholder for agent's last name
      };

      const findAgent = await Company.findOne({ _id: userId });
      const findStudent = await StudentInformation.findOne({ _id: userId });

      // Determine the customUserId
      result.customUserId = findAgent
        ? findAgent.agId
        : findStudent
        ? findStudent.stId
        : null;

      // Extract agent's firstName and lastName if found
      if (findAgent && findAgent.primaryContact) {
        result.agentFirstName = findAgent.primaryContact.firstName;
        result.agentLastName = findAgent.primaryContact.lastName;
      }

      // Check if offerLetter has personalInformation
      if (app.offerLetter && app.offerLetter.personalInformation) {
        result.fullName = app.offerLetter.personalInformation.fullName;
        result.type = "offerLetter"; // Set type to offerLetter
        result.status = app.offerLetter.status; // Add offerLetter status
        result.message = app.offerLetter.message; // Add offerLetter message
      }
      // Check if gic has personalDetails
      else if (app.gic && app.gic.personalDetails) {
        result.fullName = app.gic.personalDetails.fullName;
        result.type = "gic"; // Set type to gic
        result.status = app.gic.status; // Add gic status
        result.message = app.gic.message; // Add gic message
      }

      return result.fullName ? result : null; // Return result if fullName exists, else null
    })
  );

  // Filter out null entries
  const filteredApplications = transformedApplications.filter((app) => app);

  // Pagination logic
  const totalPages = Math.ceil(totalApplications / limit);
  const currentPage = page;
  const previousPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  // Respond with paginated applications and metadata
  res.status(200).json({
    total: totalApplications,
    currentPage,
    previousPage,
    nextPage,
    totalPages,
    limit,
    applications: filteredApplications,
  });
});




const changeApplicationStatus = asyncHandler(async (req, res) => {
  const { institutionId } = req.params;
  const { section, status, message } = req.body;

  // Validate required fields
  if (!section || !status) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Both section and status are required"));
  }

  // Find the institution
  const institution = await Institution.findOne({
    _id: institutionId,
  }).populate("studentInformationId");
  if (!institution) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "Institution not found"));
  }
  const userId = institution.userId;
  // const findStudent = await Student.findOne({_id: userId}) ;
  const findAgent = await Agent.findOne({ _id: userId });
  // Retrieve student's information
  const studentInfo = await StudentInformation.findOne({
    _id: institution.studentInformationId,
  });
  if (!studentInfo) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "Student information not found"));
  }

  const { firstName, email } = studentInfo.personalInformation;
  const { country, course } = institution.offerLetter.preferences;
  const collegeName = institution.offerLetter.preferences.institution; // Assuming this is the correct field for college name

  // Update the status for the specified section
  if (section === "offerLetter") {
    if (status == "approved") {
      institution.offerLetter.status = status;
      if (message) {
        institution.offerLetter.message = message;
      }
      const temp = studentOfferLetterApprovedTemp(
        firstName,
        collegeName,
        country,
        course
      );
      await sendEmail({
        to: email,
        subject: "Your Offer Letter is Approved Proceed with Payment",
        htmlContent: temp,
      });
      if (findAgent) {
        const temp = agentOfferLetterApproved(
          findAgent.accountDetails.primaryContactPerson.name,
          studentName,
          collegeName,
          country,
          course
        );
        await sendEmail({
          to: findAgent.accountDetails.founderOrCeo.email,
          subject: `Offer Letter Approved for ${studentName} Proceed with Next Steps`,
          htmlContent: temp,
        });
      }
    } else if (status == "rejected") {
      institution.offerLetter.status = status;
      if (message) {
        institution.offerLetter.message = message;
      }
      const temp = studentOfferLetterRejectedTemp(
        firstName,
        collegeName,
        country,
        course,
        message
      );
      await sendEmail({
        to: email,
        subject: "Your Offer Letter is Approved Proceed with Payment",
        htmlContent: temp,
      });
      if (findAgent) {
        const temp = agentOfferLetterRejected(
          findAgent.accountDetails.primaryContactPerson.name,
          studentName,
          collegeName,
          country,
          course,
          message
        );
        await sendEmail({
          to: findAgent.accountDetails.founderOrCeo.email,
          subject: `Offer Letter Rejected for ${studentName} Action Required`,
          htmlContent: temp,
        });
      }
    }
  } else if (section === "gic") {
    institution.gic.status = status;
    if (message) {
      institution.gic.message = message;
    }
  } else {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Invalid section provided"));
  }

  // Save the updated institution data
  await institution.save();

  // Return success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { institution },
        `${section} status updated successfully`
      )
    );
});

const getTotalApplicationCount = asyncHandler(async (req, res) => {
  const totalCount = await Institution.countDocuments({
    $or: [{ "offerLetter.type": "offerLetter" }, { "gic.type": "GIC" }],
  });

  // Pending count for both offerLetter and gic
  const pendingCount = await Institution.countDocuments({
    $or: [{ "offerLetter.status": "pending" }, { "gic.status": "pending" }],
  });

  // Approved count for both offerLetter and gic
  const approvedCount = await Institution.countDocuments({
    $or: [{ "offerLetter.status": "approved" }, { "gic.status": "approved" }],
  });

  // Send response with the counts

  return res.status(200).json(
    new ApiResponse({
      statusCode: 200,
      totalCount: totalCount,
      pendingCount: pendingCount,
      approvedCount: approvedCount,
      message: "Application counts retrieved successfully",
    })
  );
});

const getTotalTicketCount = asyncHandler(async (req, res) => {
  const totalCount = await Ticket.countDocuments();

  const pendingCount = await Ticket.countDocuments({ status: "underReview" });

  const approvedCount = await Ticket.countDocuments({ status: "approved" });

  return res.status(200).json(
    new ApiResponse({
      statusCode: 200,
      totalCount,
      pendingCount,
      approvedCount,
      message: "Ticket counts retrieved successfully",
    })
  );
});

const getTotalUserCount = asyncHandler(async (req, res) => {
  const { year } = req.query;

  let dateFilter = {};
  if (year) {
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    dateFilter = {
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    };
  }

  const studentCount = await Student.countDocuments(dateFilter);

  const agentCount = await Agent.countDocuments(dateFilter);

  const totalUserCount = studentCount + agentCount;

  return res.status(200).json(
    new ApiResponse({
      statusCode: 200,
      totalUserCount,
      studentCount,
      agentCount,
      message: `User counts retrieved successfully for the year ${
        year || "all years"
      }`,
    })
  );
});

const getAllDataAgentStudent = asyncHandler(async (req, res) => {
  // Pagination parameters
  const page = parseInt(req.query.page) || 1; // Current page, defaults to 1
  const limit = parseInt(req.query.limit) || 10; // Limit per page, defaults to 10
  const skip = (page - 1) * limit; // Calculate skip

  const { search } = req.query; // Get the 'search' filter from query params

  let formattedAgents = [];
  let formattedStudents = [];
  let totalCompanies = 0;
  let totalStudents = 0;
  let totalPages = 0;
  let totalStudentPages = 0;

  // Create search conditions based on 'search' query for both agents and students
  const searchCondition = search
    ? {
        $or: [
          { "primaryContact.firstName": new RegExp(search, "i") },
          { "primaryContact.lastName": new RegExp(search, "i") },
        ],
      }
    : {}; // If no search query, don't apply a filter

  const studentSearchCondition = search
    ? {
        $or: [
          { "personalInformation.firstName": new RegExp(search, "i") },
          { "personalInformation.lastName": new RegExp(search, "i") },
        ],
      }
    : {}; // If no search query, don't apply a filter

  // Fetch agents
  const companies = await Company.find({ pageCount: 6, ...searchCondition })
    .select("primaryContact.firstName primaryContact.lastName agId")
    .lean()
    .skip(skip)
    .limit(limit);

  formattedAgents = companies.map((company) => {
    const { firstName, lastName } = company.primaryContact || {};
    return {
      firstName: firstName || "N/A",
      lastName: lastName || "N/A",
      agId: company.agId,
      type: "agent",
    };
  });

  totalCompanies = await Company.countDocuments({
    pageCount: 6,
    ...searchCondition,
  });
  totalPages = Math.ceil(totalCompanies / limit); // Calculate total pages for agents

  // Fetch students
  const students = await StudentInformation.find(
    { pageCount: 3, deleted: false, ...studentSearchCondition },
    {
      "personalInformation.firstName": 1,
      "personalInformation.lastName": 1,
      stId: 1,
    }
  )
    .lean()
    .skip(skip)
    .limit(limit);

  formattedStudents = students.map((student) => ({
    firstName: student.personalInformation?.firstName || "N/A",
    lastName: student.personalInformation?.lastName || "N/A",
    stId: student.stId,
    type: "student",
  }));

  totalStudents = await StudentInformation.countDocuments({
    pageCount: 3,
    deleted: false,
    ...studentSearchCondition,
  });
  totalStudentPages = Math.ceil(totalStudents / limit); // Calculate total pages for students

  // Combine agents and students
  const combinedResults = [...formattedAgents, ...formattedStudents];

  // Calculate the overall total count and total pages
  const totalCount = formattedAgents.length + formattedStudents.length;
  const combinedTotalPages = totalPages + totalStudentPages;

  // Prepare pagination info
  const paginationInfo = {
    currentPage: page,
    nextPage: page < combinedTotalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
    totalPages: combinedTotalPages,
    totalCount: totalCompanies + totalStudents,
  };

  // Return the combined results with pagination info
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        combinedResults,
        "Data fetched successfully",
        paginationInfo
      )
    );
});

const getAgentById = asyncHandler(async (req, res) => {
  // Extract the company ID from the request parameters
  const { id } = req.params;

  // Fetch the company data by its ID
  const company = await Company.findById(id);

  // If no company is found, return an error
  if (!company) {
    return res.status(404).json(
      new ApiResponse({
        statusCode: 404,
        message: "Company not found",
      })
    );
  }

  // Return the company data
  return res.status(200).json(
    new ApiResponse({
      statusCode: 200,
      data: company,
      message: "Company fetched successfully",
    })
  );
});

const getStudentById = asyncHandler(async (req, res) => {
  // Extract the student ID from the request parameters
  const { id } = req.params;

  // Fetch the student data by its ID
  const student = await StudentInformation.findById(id);

  // If no student is found, return a 404 error
  if (!student) {
    return res.status(404).json(
      new ApiResponse({
        statusCode: 404,
        message: "Student not found",
      })
    );
  }

  // Return the student data with a 200 status
  return res.status(200).json(
    new ApiResponse({
      statusCode: 200,
      data: student,
      message: "Student fetched successfully",
    })
  );
});

const updatePageStatus = asyncHandler(async (req, res) => {
  const { id } = req.params; // Extracting id from route parameters
  const { status, message, type } = req.body; // Extracting status, message, and type from the request body

  // Validate status
  const validStatuses = [
    "registering",
    "inProgress",
    "completed",
    "pending",
    "rejected",
  ];
  if (!validStatuses.includes(status)) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          {},
          'Invalid status value. Valid values are: "registering", "inProgress", "completed", "pending", "rejected".'
        )
      );
  }

  // Check the 'type' to determine whether it's a company or student
  let model;
  if (type === "company") {
    model = Company; // Use the Company model
  } else if (type === "student") {
    model = StudentInformation; // Use the StudentInformation model
  } else {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          {},
          "'type' must be either 'company' or 'student'."
        )
      );
  }

  // Find the document by ID
  const document = await model.findById(id);
  if (!document) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          {},
          `${type.charAt(0).toUpperCase() + type.slice(1)} not found.`
        )
      );
  }

  // Update the pageStatus with the new status and message
  document.pageStatus = {
    status,
    message: message || "", // Default message to empty string if not provided
  };

  // Save the updated document
  await document.save();

  // Send success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        document,
        `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } page status updated successfully.`
      )
    );
});

export {
  getTotalAgentsCount,
  getTotalStudentCount,
  changeStudentInformationStatus,
  changeApplicationStatus,
  getTotalApplicationCount,
  getTotalTicketCount,
  getTotalUserCount,
  getAllDataAgentStudent,
  getAgentById,
  getStudentById,
  updatePageStatus,
};
