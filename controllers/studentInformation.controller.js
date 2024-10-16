import { StudentInformation } from "../models/studentInformation.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  studentPersonalAndPassportSchema,
  studentPreferencesSchema,
  studentResidenceAndMailingAddressSchema,
} from "../validators/studentInformation.validator.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

async function generateStudentId() {
  const today = new Date();

  // Format the date components (DDMMYY)
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear().toString().slice(2);

  // Construct the base Student ID without the sequence number
  const baseId = `ST-${year}${month}${day}`;

  // Find the last created student with a matching date prefix (e.g., ST-240926)
  const lastStudent = await StudentInformation
    .findOne({ studentId: { $regex: `^${baseId}` } })  // Search for existing IDs with the same base
    .sort({ studentId: -1 })  // Sort by descending order to get the last created one
    .exec();

  let sequenceNumber = 1;  // Default sequence number if no match found

  if (lastStudent) {
    // Extract the last two digits (sequence number) from the last studentId
    const lastId = lastStudent.studentId;
    const lastSequence = parseInt(lastId.slice(-2), 10);  // Get the last 2 digits of the studentId
    
    // Increment the sequence number for the new ID
    sequenceNumber = lastSequence + 1;
  }

  // Format the sequence number as a two-digit number
  const sequenceStr = sequenceNumber.toString().padStart(2, '0');

  // Return the unique Student ID (e.g., ST-24092601)
  return `${baseId}${sequenceStr}`;
}


const studentPersonalInformation = asyncHandler(async (req, res) => {
  const { body: payload } = req;

  // Validate payload using Zod
  const validation = studentPersonalAndPassportSchema.safeParse(payload);
  if (!validation.success) {
    const errorMessage = validation.error.errors[0];
    return res.status(400).json(new ApiResponse(400, {}, `Validation Error: ${errorMessage}`));
  }

  const { personalInformation, passportDetails } = validation.data;
  const idField = req.user.role === '2' ? 'agentId' : 'studentId';

  // Check if phone number already exists
  const existingRecordByPhone = await StudentInformation.findOne({
    "personalInformation.phone.phone": personalInformation.phone.phone,
  });

  // Check if email already exists
  const existingRecordByEmail = await StudentInformation.findOne({
    "personalInformation.email": personalInformation.email,
  });

  // If phone number exists but is associated with another user, deny access
  if (existingRecordByPhone && existingRecordByPhone[idField]?.toString() !== req.user.id) {
    return res.status(403).json(new ApiResponse(403, {}, "Unauthorized: Phone number already associated with another user"));
  }

  // If email exists but is associated with another user, deny access
  if (existingRecordByEmail && existingRecordByEmail[idField]?.toString() !== req.user.id) {
    return res.status(403).json(new ApiResponse(403, {}, "Unauthorized: Email already associated with another user"));
  }

  // Prepare data to save or update
  const data = {
    personalInformation: {
      ...personalInformation,
      phone: { ...personalInformation.phone },
    },
    passportDetails: {
      ...passportDetails,
    },
    [idField]: req.user.id, // Dynamically assign either studentId or agentId
    pageCount: 1,
  };

  if (existingRecordByPhone) {
    // Update the existing record
    const updatedRecord = await StudentInformation.findOneAndUpdate(
      { _id: existingRecordByPhone._id },
      { $set: data },
      { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedRecord, "Personal Information updated successfully"));
  } else {
    // Save new student information
    const studentInfo = await StudentInformation.create(data);
    return res.status(201).json(new ApiResponse(201, studentInfo, "Personal Information saved successfully"));
  }
});


const studentResidenceAndAddress = asyncHandler(async (req, res) => {
  const payload = req.body;
  const { formId } = req.params;

  // Validate the payload against the Zod schema
  const validation = studentResidenceAndMailingAddressSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors[0].message));
  }

  // Prepare the update object based on the validated payload
  const updateData = {
    residenceAddress: {
      address: payload.residenceAddress?.address,
      country: payload.residenceAddress?.country,
      state: payload.residenceAddress?.state,
      city: payload.residenceAddress?.city,
      zipcode: payload.residenceAddress?.zipcode,
    },
    mailingAddress: {
      address: payload.mailingAddress?.address,
      country: payload.mailingAddress?.country,
      state: payload.mailingAddress?.state,
      city: payload.mailingAddress?.city,
      zipcode: payload.mailingAddress?.zipcode,
    },
    pageCount: 2,
  };

  // Update the StudentInformation document
  const updatedStudentInfo = await StudentInformation.findOneAndUpdate(
    { _id: formId },
    { $set: updateData },
    { new: true }
  );

  // Check if the document was found and updated
  if (!updatedStudentInfo) {
    return res.status(404).json(new ApiResponse(404, {}, "Student information not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedStudentInfo, "Data saved successfully"));
});

const studentPreference = asyncHandler(async (req, res) => {
  const payload = req.body;
  const {formId} = req.params;

  const validation = studentPreferencesSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors[0].message));
  }

  const stId = await generateStudentId();

  await StudentInformation.findOneAndUpdate(
    { _id: formId },
    {
      $set: {
        preferences: {
          preferredCountry: payload.preferredCountry,
          preferredState: payload.preferredState,
          preferredProgram: payload.preferredProgram,
          preferredLevelOfEducation: payload.preferredLevelOfEducation,
          preferredInstitution: payload.preferredInstitution,
        },
        pageCount: 3,
        pageStatus:{
          status:"notapproved"
        },
        stId: stId
      },
    },
    { new: true }
  );

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "data saved successfully"));
});

const getStudentPersonalInformation = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const studentPersonalInformation = await StudentInformation.findOne({
    studentId: studentId,
  });
   
  if(!studentPersonalInformation){
    return res.status(404).json(
      new ApiResponse(404, {}, "Student not found")
    )
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, studentPersonalInformation, "data get successfully")
    );
});

// const getStudentDetails = asyncHandler(async (req, res) => {
//   const studentDetails = await Student.findOne({
//     _id: req.user.id,
//   }).select("-password");
//   return res
//     .status(200)
//     .json(new ApiResponse(200, studentDetails, "data get successfully"));
// });

// const getAllStudents = asyncHandler(async (req, res) => {
//   const allStudents = await Student.findAll().select("-password");
//   return res
//     .status(200)
//     .json(new ApiResponse(200, allStudents, "data get successfully"));
// });

const updateStudentPersonalInformation = asyncHandler(async (req, res) => {
  const { body: payload } = req;
  const { formId } = req.params;

  // Validate if formId is provided
  if (!formId) {
    return res.status(400).json(new ApiResponse(400, {}, "Form ID is required"));
  }

  // Find the existing student information by formId and update it
  const updatedStudentInfo = await StudentInformation.findOneAndUpdate(
    { _id: formId },  // Assuming formId corresponds to the MongoDB document ID
    { $set: payload },  // Update the document with the new data
    { new: true, runValidators: true } // Return the updated document, and run validators
  );

  // If no document is found, return a 404 error
  if (!updatedStudentInfo) {
    return res.status(404).json(new ApiResponse(404, {}, "Student information not found"));
  }

  // Respond with success
  return res.status(200).json(new ApiResponse(200, updatedStudentInfo, "Personal Information updated successfully"));
});

const getAllAgentStudent = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, email, stId, firstName, lastName, phone } = req.query; // Add filterable fields
  const agentId = req.user.id;

  // Check if the user role is authorized
  if (req.user.role !== '2') {
    return res
      .status(403) // 403 Forbidden for unauthorized access
      .json(new ApiResponse(403, {}, "Unauthorized access: Only agents can fetch student data"));
  }

  // Build the query object dynamically based on the provided filters
  const query = { agentId };

  if (email) {
    query['personalInformation.email'] = email;
  }
  if (stId) {
    query.stId = stId;
  }
  if (firstName) {
    query['personalInformation.firstName'] = firstName;
  }
  if (lastName) {
    query['personalInformation.lastName'] = lastName;
  }
  if (phone) {
    query['personalInformation.phone.phone'] = phone; // Match phone number
  }

  // Fetch all students where agentId matches req.user.id and apply filters with pagination
  const allStudents = await StudentInformation.find(query)
    .select("-__v") // Exclude the version field
    .limit(parseInt(limit)) // Limit the number of results per page
    .skip((parseInt(page) - 1) * parseInt(limit)); // Skip results for pagination

  // Get the total count of students matching the query
  const totalStudents = await StudentInformation.countDocuments(query);

  // Check if any students exist for this agent
  if (!allStudents.length) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "No students found for this agent"));
  }

  // Prepare pagination data
  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalStudents / limit),
    pageSize: parseInt(limit),
    totalItems: totalStudents,
  };

  // Respond with paginated results
  return res
    .status(200)
    .json(new ApiResponse(200, { students: allStudents, pagination }, "Students fetched successfully"));
});


const getStudentFormById = asyncHandler(async (req, res) => {
  const { formId } = req.params;

  // Fetch student information by formId
  const studentInformation = await StudentInformation.findById(formId);

  // If student information is not found, return 404
  if (!studentInformation) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "Student information not found"));
  }

  // Respond with success if student information is found
  return res
    .status(200)
    .json(new ApiResponse(200, studentInformation, "Student information retrieved successfully"));
});



export {
  studentPersonalInformation,
  studentResidenceAndAddress,
  studentPreference,
  getStudentPersonalInformation,
  // getStudentDetails,
  // getAllStudents,
  updateStudentPersonalInformation,
  getAllAgentStudent,
  getStudentFormById
};
