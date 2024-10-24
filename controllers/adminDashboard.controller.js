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

  // Filtering logic
  if (req.query.applicationId) {
    query.applicationId = req.query.applicationId;
  }

  if (req.query.fullName) {
    const regex = { $regex: req.query.fullName, $options: "i" };
    orConditions.push(
      { "offerLetter.personalInformation.fullName": regex },
      { "gic.personalDetails.fullName": regex }
    );
  }

  if (req.query.phoneNumber) {
    orConditions.push(
      { "offerLetter.personalInformation.phoneNumber": req.query.phoneNumber },
      { "gic.personalDetails.phoneNumber": req.query.phoneNumber }
    );
  }

  if (req.query.institution) {
    query["offerLetter.preferences.institution"] = {
      $regex: req.query.institution,
      $options: "i",
    };
  }

  if (req.query.country) {
    query["offerLetter.preferences.country"] = {
      $regex: req.query.country,
      $options: "i",
    };
  }

  // Add filter for type (offerLetter or gic)
  if (req.query.type) {
    const validTypes = ["offerLetter", "gic"];
    if (!validTypes.includes(req.query.type)) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid type filter provided."));
    }
    query[`${req.query.type}`] = { $exists: true };
  }

  // Filter by status in both offerLetter and gic
  if (req.query.status) {
    const validStatuses = ["underreview", "completed", "rejected", "approved"];
    if (!validStatuses.includes(req.query.status)) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid status filter provided."));
    }
    query.$or = [
      { "offerLetter.status": req.query.status },
      { "gic.status": req.query.status }
    ];
  }

  // Apply orConditions for search queries (name, phone, etc.)
  if (orConditions.length > 0) {
    query.$or = orConditions;
  }

  // Fetch paginated applications with applied filters
  const applications = await Institution.find(query)
    .select("-__v")  // Exclude __v field
    .skip(skip)
    .limit(limit)
    .lean();

  const totalApplications = await Institution.countDocuments(query);

  // Transform applications and consolidate agent/student fetches
  const transformedApplications = applications.map(async (app) => {
    const userId = app.userId;
    const userType = app.studentInformationId ? "student" : "agent";

    const result = {
      userId,
      userType,
      institutionId: app._id,
      applicationId: app.applicationId,
      status: null,
      message: null,
      agentName: null,
    };

    // Fetch agent or student data
    const findAgent = await Company.findOne({ agentId: userId }).lean();
    const findStudent = !findAgent && await StudentInformation.findOne({ studentId: userId }).lean();

    result.customUserId = findAgent
      ? findAgent.agId
      : findStudent
      ? findStudent.stId
      : null;

    if (findAgent) {
      const agentData = await Agent.findById(userId.toString());
      if (agentData) {
        result.agentName = agentData.accountDetails?.primaryContactPerson?.name || null;
      }
    }

    // Check offerLetter and gic status
    if (app.offerLetter?.personalInformation) {
      result.fullName = app.offerLetter.personalInformation.fullName;
      result.type = "offerLetter";
      result.status = app.offerLetter.status;
      result.message = app.offerLetter.message;
    } else if (app.gic?.personalDetails) {
      result.fullName = app.gic.personalDetails.fullName;
      result.type = "gic";
      result.status = app.gic.status;
      result.message = app.gic.message;
    }

    return result.fullName ? result : null;
  });

  // Resolve all promises
  const filteredApplications = (
    await Promise.all(transformedApplications)
  ).filter(Boolean);

  // Pagination logic
  const totalPages = Math.ceil(totalApplications / limit);

  res.status(200).json({
    total: totalApplications,
    currentPage: page,
    previousPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
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
  const page = parseInt(req.query.page) || 1; 
  const limit = parseInt(req.query.limit) || 10; 
  const { search, status } = req.query; 
   
  console.log(status, "++++++");

  let formattedAgents = [];
  let formattedStudents = [];
  let totalCompanies = 0;
  let totalStudents = 0;
  let totalPages = 0;
  let totalStudentPages = 0;

  // Create search conditions with `pageStatus.status`
  const searchCondition = {
    ...(search
      ? {
          $or: [
            { "primaryContact.firstName": new RegExp(search, "i") },
            { "primaryContact.lastName": new RegExp(search, "i") },
          ],
        }
      : {}),
    ...(status ? { "pageStatus.status": status } : {}), // Add status filter
    pageCount: 6,
  };

  const studentSearchCondition = {
    ...(search
      ? {
          $or: [
            { "personalInformation.firstName": new RegExp(search, "i") },
            { "personalInformation.lastName": new RegExp(search, "i") },
          ],
        }
      : {}),
    ...(status ? { "pageStatus.status": status } : {}), // Add status filter
    pageCount: 3,
    deleted: false,
  };

  // Fetch agents
  const agents = await Company.find(searchCondition)
    .select(
      "primaryContact.firstName primaryContact.lastName agId _id pageStatus.message"
    )
    .lean()
    .skip((page - 1) * limit)
    .limit(limit);

  formattedAgents = agents.map((company) => {
    const { firstName, lastName } = company.primaryContact || {};
    return {
      firstName: firstName || "N/A",
      lastName: lastName || "N/A",
      agId: company.agId,
      _id: company._id,
      message: company.pageStatus?.message || "",
      type: "agent",
    };
  });

  totalCompanies = await Company.countDocuments(searchCondition);
  totalPages = Math.ceil(totalCompanies / limit);

  // Fetch students
  const students = await StudentInformation.find(studentSearchCondition)
    .select(
      "personalInformation.firstName personalInformation.lastName stId _id pageStatus.message"
    )
    .lean()
    .skip((page - 1) * limit)
    .limit(limit);

  formattedStudents = students.map((student) => ({
    firstName: student.personalInformation?.firstName || "N/A",
    lastName: student.personalInformation?.lastName || "N/A",
    stId: student.stId,
    _id: student._id,
    message: student.pageStatus?.message || "",
    type: "student",
  }));

  totalStudents = await StudentInformation.countDocuments(studentSearchCondition);
  totalStudentPages = Math.ceil(totalStudents / limit);

  // Combine agents and students
  const combinedResults = [...formattedAgents, ...formattedStudents];

  // Prepare pagination info
  const paginationInfo = {
    currentPage: page,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
    totalPages: Math.max(totalPages, totalStudentPages),
    totalCount: totalCompanies + totalStudents,
  };

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
  const { id } = req.params;
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
