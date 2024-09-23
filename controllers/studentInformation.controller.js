import { StudentInformation } from "../models/studentInformation.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  studentPersonalAndPassportSchema,
  studentPreferencesSchema,
  studentResidenceAndAddressSchema,
} from "../validators/studentInformation.validator.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const studentPersonalInformation = asyncHandler(async (req, res) => {
  const { body: payload } = req;

  // Validate payload using Zod
  const validation = studentPersonalAndPassportSchema.safeParse(payload);
  if (!validation.success) {
    const errorMessage = validation.error.errors[0].message;
    return res.status(400).json(new ApiResponse(400, {}, errorMessage));
  }

  const { personalInformation, passportDetails } = validation.data;

  // Check if email, phone, or passport number already exists
  const existingRecord = await StudentInformation.findOne({
    $or: [
      { "personalInformation.email": personalInformation.email },
      { "personalInformation.phone.phone": personalInformation.phone.phone },
      { "passportDetails.passportNumber": passportDetails.passportNumber }
    ]
  });

  if (existingRecord) {
    return res.status(400).json(new ApiResponse(400, {}, "Email, phone, or passport number already exists"));
  }

  // Determine the ID based on the user role
  const idField = req.user.role === '3' ? 'agentId' : 'studentId';

  // Create data to save, dynamically setting either studentId or agentId
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

  // Save the student information
  const studentInfo = await StudentInformation.create(data);

  // Respond with success
  return res.status(201).json(new ApiResponse(201, studentInfo, "Personal Information saved successfully"));
});



const studentResidenceAndAddress = asyncHandler(async (req, res) => {
  const payload = req.body;
  const {formId} = req.params;
  const validation = studentResidenceAndAddressSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors[0].message));
  }

  await StudentInformation.findOneAndUpdate(
    { _id: formId  },
    {
      $set: {
        residenceAddress: {
          address: payload.address,
          country: payload.country,
          state: payload.state,
          city: payload.city,
          zipcode: payload.zipcode,
        },
        pageCount: 2
      },
    },
    { new: true }
  );

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "data saved successfully"));
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
        pageCount: 3
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

const getAllAgentStudent = asyncHandler(async(req, res)=>{
  const { page = 1, limit = 10 } = req.query; // Set default values for pagination
  const agentId = req.user.id; 

  // Check if the user role is authorized
  if (req.user.role !== '2') {
    return res
      .status(403) // 403 Forbidden for unauthorized access
      .json(new ApiResponse(403, {}, "Unauthorized access: Only agents can fetch student data"));
  }

  // Fetch all students where agentId matches req.user.id with pagination
  const allStudents = await StudentInformation.find({ agentId })
    .select("-__v") // Exclude the version field
    .limit(parseInt(limit)) // Limit the number of results per page
    .skip((parseInt(page) - 1) * parseInt(limit)); // Skip results for pagination

  // Get total count of students
  const totalStudents = await StudentInformation.countDocuments({ agentId });

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

const getStudentFormById = asyncHandler(async(req, res)=>{
  const {formId} = red.params;
  
  const studentInformation = await  StudentInformation.find({ _id: formId });
  if(!studentInformation){
    res.status(404).json(
      new ApiResponse(404, {}, "Student information not found")
    )
  }

  return res.status(200).json(
    new ApiResponse(200, studentInformation, "Student information get successfully")
  )

})



export {
  studentPersonalInformation,
  studentResidenceAndAddress,
  studentPreference,
  getStudentPersonalInformation,
  getStudentDetails,
  getAllStudents,
  updateStudentPersonalInformation,
  getAllAgentStudent,
  getStudentFormById
};
