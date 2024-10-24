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
import { studentRegistrationComplete } from "../utils/mailTemp.js";
import { sendEmailVerification } from "../utils/sendMail.js";

async function generateStudentId() {
  const today = new Date();

  // Format the date components (YYMMDD)
  const year = today.getFullYear().toString().slice(2); // Last 2 digits of the year
  const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero if necessary
  const day = today.getDate().toString().padStart(2, '0'); // Day with leading zero if necessary

  // Construct the base Student ID (ST-YYMMDD)
  const baseId = `ST-${year}${month}${day}`;

  // Use the 'stId' field for counting, not 'studentId' (because 'studentId' is an ObjectId, and regex doesn't work with ObjectId)
  const count = await StudentInformation.countDocuments({ stId: { $regex: `^${baseId}` } }).exec();

  // The sequence number is based on the count (0-based index + 1)
  const sequenceNumber = count + 1;

  // Format the sequence number as a two-digit number
  const sequenceStr = sequenceNumber.toString().padStart(2, '0'); // Ensure it's always 2 digits

  // Return the unique Student ID (e.g., ST-24102101)
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
    return res.status(400).json(new ApiResponse(400, {}, "User already exists from this email"));
  }

  const {edit} = req.query;
  // Prepare data to save or update
  let data;
  if(edit){
     data = {
      personalInformation: {
        ...personalInformation,
        phone: { ...personalInformation.phone },
      },
      passportDetails: {
        ...passportDetails,
      },
      [idField]: req.user.id, // Dynamically assign either studentId or agentId
    };
  } else {
     data = {
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
  }

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


const studentResidenceAndAddress = async (req, res) => {
    const payload = req.body;
    const { formId } = req.params;

    // Check if formId is provided for edit operation
    const isEdit = req.query.edit !== undefined;

    // Validate the payload against the Zod schema
    const validation = studentResidenceAndMailingAddressSchema.safeParse(payload);
    if (!validation.success) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, validation.error.errors[0].message));
    }

    // Prepare update data
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
    };

    // Check if a document with the provided formId already exists
    const existingStudentInfo = await StudentInformation.findById(formId);

    if (existingStudentInfo) {
      // If we're in edit mode or if the existing document has addresses, update the document
      const updatedStudentInfo = await StudentInformation.findByIdAndUpdate(
        formId,
        { $set: updateData },
        { new: true }
      );

      // Check if the document was updated successfully
      if (!updatedStudentInfo) {
        return res.status(404).json(new ApiResponse(404, {}, "Student information not found"));
      }

      return res
        .status(200)
        .json(new ApiResponse(200, updatedStudentInfo, "Data updated successfully"));
    } else {
      // Create a new StudentInformation document if no existing record is found
      const newStudentInfo = new StudentInformation({
        ...updateData,
        studentId: payload.studentId, // Ensure this is provided in payload
        agentId: payload.agentId, // Ensure this is provided in payload
        pageCount: 2, // Set initial pageCount
        pageStatus: {
          status: "registering", // Default status
          message: "" // Default message
        }
      });

      // Save the new student information
      const savedStudentInfo = await newStudentInfo.save();

      return res
        .status(201)
        .json(new ApiResponse(201, savedStudentInfo, "Data saved successfully"));
    }
  
};


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
  

  const {edit} = req.query;
  let studentInfo;

  if(edit){
    studentInfo = await StudentInformation.findOneAndUpdate(
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
          pageStatus:{
            status:"notapproved"
          },
          stId: stId
        },
      },
      { new: true }
    );
  } else{

   studentInfo = await StudentInformation.findOneAndUpdate(
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
}

  const temp = studentRegistrationComplete(studentInfo.personalInformation.firstName);
  await sendEmailVerification(studentInfo.personalInformation.email, "Registration Successful – Awaiting Admin Approval", temp)

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
  const { page = 1, limit = 10, searchData } = req.query; // Extract pagination and search parameters
  const agentId = req.user.id;

  // Check if the user role is authorized
  if (req.user.role !== '2') {
    return res.status(403).json(
      new ApiResponse(403, {}, "Unauthorized access: Only agents can fetch student data")
    );
  }

  // Initialize query and matchQuery objects with agentId and non-deleted students
  const query = { agentId, deleted: false }; 
  const matchQuery = { agentId, deleted: false };

  // Dynamic search query construction
  if (searchData) {
    const regex = new RegExp(searchData, 'i');
    query.$or = [
      { 'personalInformation.email': regex },
      { 'stId': regex },
      { 'personalInformation.firstName': regex },
      { 'personalInformation.lastName': regex },
      { 'personalInformation.phone.phone': regex }
    ];
  }

  // Add specific filters if provided
  const filters = ['email', 'stId', 'firstName', 'lastName', 'phone'];
  filters.forEach(filter => {
    if (req.query[filter]) {
      query[`personalInformation.${filter}`] = req.query[filter];
      matchQuery[`personalInformation.${filter}`] = req.query[filter];
    }
  });

  // Fetch students with aggregation
  const allStudents = await StudentInformation.aggregate([
    { $match: matchQuery }, // Match query for agentId and non-deleted students
    {
      $lookup: {
        from: 'institutions',
        localField: '_id',
        foreignField: 'studentInformationId',
        as: 'applications'
      }
    },
    {
      $addFields: {
        applicationCount: { $size: "$applications" }
      }
    },
    {
      $facet: {
        totalCount: [{ $count: "count" }],
        data: [
          { $skip: (page - 1) * limit },
          { $limit: parseInt(limit) }
        ]
      }
    }
  ]);

  const totalRecords = allStudents[0]?.totalCount[0]?.count || 0;
  const students = allStudents[0]?.data || [];

  // Pagination logic
  const totalPages = Math.ceil(totalRecords / limit);
  const currentPage = parseInt(page);
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Check if any students exist for this agent
  if (!students.length) {
    return res.status(404).json(new ApiResponse(404, {}, "No students found for this agent"));
  }

  res.status(200).json(new ApiResponse(200, {
    totalRecords,
    totalPages,
    currentPage,
    prevPage,
    nextPage,
    hasPreviousPage,
    hasNextPage,
    students
  }, "Students fetched successfully"));
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

const deleteStudentInformation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const studentInfo = await StudentInformation.findById(id);
  if (!studentInfo) {
      return res.status(404).json(new ApiResponse(404, {}, 'Student information not found.'));
  }

  studentInfo.deleted = true;

  await studentInfo.save();

  return res.status(200).json(new ApiResponse(200, studentInfo, 'Student information marked as deleted.'));
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
  getStudentFormById,
  deleteStudentInformation
};
