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

  // Determine the ID based on the user role
  let idField = 'studentId'; // Default to studentId
  if (req.user.role === '3') {
    idField = 'agentId';
  } else if (req.user.role === '2') {
    idField = 'studentId';
  }

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
  const validation = studentResidenceAndAddressSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors[0].message));
  }

  await StudentInformation.findOneAndUpdate(
    { studentId: req.user.id },
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
  const validation = studentPreferencesSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors[0].message));
  }

  await StudentInformation.findOneAndUpdate(
    { studentId: req.user.id },
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

const getStudentDetails = asyncHandler(async (req, res) => {
  const studentDetails = await Student.findOne({
    _id: req.user.id,
  }).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, studentDetails, "data get successfully"));
});

const getAllStudents = asyncHandler(async (req, res) => {
  const allStudents = await Student.findAll().select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, allStudents, "data get successfully"));
});

const updateStudentPersonalInformation = asyncHandler(async (req, res) => {
  const payload = req.body;
  // Validate payload using Zod
  const validation = studentPersonalInformationSchema.safeParse(payload);
  if (!validation.success) {
    return res.status(400).json(new ApiResponse(400, {}, validation.error.errors[0].message));
  }

  // Ensure the file is uploaded
  const passportFile = req.file?.path;
  
  if (!passportFile) {
    return res.status(400).json(new ApiResponse(400, {}, "Passport is missing"));
  }

  // Upload the passport to Cloudinary
  const passport = await uploadOnCloudinary(passportFile);
  if (!passport) {
    return res.status(400).json(new ApiResponse(400, {}, "Failed to upload passport"));
  }

  // Construct the student data object
  const personalInformationData = {
    title: payload.title,
    firstName: payload.firstName,
    lastName: payload.lastName,
    gender: payload.gender,
    maritalStatus: payload.maritalStatus,
    dob: payload.dob,
     
    firstLanguage: payload.firstLanguage,
     email: payload.email,
     phone:{
      countryCode: payload.countryCode,
       phone: payload.phone,
     }
  }
  const data = {
    personalInformation: personalInformationData,
    passportDetails: {
      passportUpload: passport.url,
      ...payload
    },
  };

  // Save personal information
  const studentPersonalInformation = await StudentInformation.create(data);

  // Respond with success
  return res
    .status(201)
    .json(new ApiResponse(201, studentPersonalInformation, "Personal Information saved successfully"));
});

export {
  studentPersonalInformation,
  studentResidenceAndAddress,
  studentPreference,
  getStudentPersonalInformation,
  getStudentDetails,
  getAllStudents,
  updateStudentPersonalInformation
};
