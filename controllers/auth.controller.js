import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import { Agent } from "../models/agent.model.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerAgentSchema,
  registerStudentSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "../validators/auth.validator.js";
import { generateTokens } from "../utils/genrateToken.js";
import { generateOtp } from "../utils/commonFuntions.js";
import { sendAuthData, sendEmailVerification } from "../utils/sendMail.js";
import { TempStudent } from "../models/tempStudent.model.js";
import { TempAgent } from "../models/tempAgent.model.js";
import crypto from 'crypto'; // Import crypto for generating a unique token
import { Student } from "../models/student.model.js";



const sentStudentOtp = asyncHandler(async (req, res) => {
  const payload = req.body;

  // Validate the payload using Zod schema
  const validation = registerStudentSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors));
  }

  // Check if the email is already in use by a student or agent
  const findTempStudent = await TempStudent.findOne({ email: payload.email });
  const findStudent = await Student.findOne({ email: payload.email });
  const isAgentExist = await Agent.exists({
    "accountDetails.founderOrCeo.email": payload.email,
  });
  if (findTempStudent || findStudent || isAgentExist) {
    return res
      .status(409)
      .json(new ApiResponse(409, {}, "Email is already in use"));
  }

  // Generate OTP and send it to the user's email
  const OTP = generateOtp();
  await sendEmailVerification(payload.email, OTP);

  // Save the user data and OTP temporarily for verification
  const tempStudent = await TempStudent.create({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    country: payload.country,
    phone: {
      code: payload.code,
      number: payload.number,
    },
    studentType: payload.studentType,
    password: payload.password, // Hash the password if needed
    hearAbout: payload.hearAbout || null,
    otp: OTP, // Save OTP
    otpExpiry: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
  });

  return res.status(200).json(
    new ApiResponse(200, { email: tempStudent.email }, "OTP sent to your email")
  );
});

const verifyStudentOtp = asyncHandler(async (req, res) => {
  const payload = req.body;

  // Validate the payload using Zod schema
  const validation = verifyOtpSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors));
  }

  // Find the temporary student record
  const tempStudent = await TempStudent.findOne({ email: payload.email });

  if (!tempStudent) {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid request"));
  }

  // Check if OTP is correct and not expired

  const isOtpValid = await tempStudent.isOtpCorrect(payload.otp);
  if (!isOtpValid || tempStudent.otpExpiry < Date.now()) {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid or expired OTP"));
  }

  await sendAuthData(payload.email, payload.password);

  // Once OTP is verified, create a new student in the Student collection
  const newStudent = await Student.create({
    firstName: tempStudent.firstName,
    lastName: tempStudent.lastName,
    email: tempStudent.email,
    country: tempStudent.country,
    phone: tempStudent.phone,
    studentType: tempStudent.studentType,
    password: tempStudent.password,
    hearAbout: tempStudent.hearAbout,
  });

  // Remove the temp student record
  await TempStudent.deleteOne({ email: payload.email });

  return res
    .status(201)
    .json(new ApiResponse(201, { email: newStudent.email }, "Student registered successfully"));
});

const sendAgentOtp = asyncHandler(async (req, res) => {
  const payload = req.body;

  // Validate the payload using Zod schema
  const validation = registerAgentSchema.safeParse(payload);
  if (!validation.success) {
    return res.status(400).json(new ApiResponse(400, {}, validation.error.errors));
  }

  // Check if the email is already in use by a student or agent
  const findTempAgent = await TempAgent.findOne({ "accountDetails.founderOrCeo.email": payload.accountDetails.founderOrCeo.email });
  const findStudent = await Student.findOne({ email: payload.accountDetails.founderOrCeo.email });
  const isAgentExist = await Agent.exists({
    "accountDetails.founderOrCeo.email": payload.accountDetails.founderOrCeo.email,
  });
  
  if (findTempAgent || findStudent || isAgentExist) {
    return res.status(409).json(new ApiResponse(409, {}, "Email is already in use"));
  }

  // Generate OTP and send it to the user's email
  const OTP = generateOtp();
  await sendEmailVerification(payload.accountDetails.founderOrCeo.email, OTP);

  // Save the agent data and OTP temporarily for verification
  const tempAgent = await TempAgent.create({
    companyDetails: payload.companyDetails,
    accountDetails: payload.accountDetails,
    password: payload.password, // Ensure password is hashed
    otp: OTP, // Save OTP
    otpExpiry: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
  });

  return res.status(200).json(
    new ApiResponse(200, { email: tempAgent.accountDetails.founderOrCeo.email }, "OTP sent to your email")
  );
});

const verifyAgentOtp = asyncHandler(async (req, res) => {
  const payload = req.body;

  // Validate the payload using Zod schema
  const validation = verifyOtpSchema.safeParse(payload);
  if (!validation.success) {
    return res.status(400).json(new ApiResponse(400, {}, validation.error.errors));
  }

  // Find the temporary agent record
  const tempAgent = await TempAgent.findOne({ "accountDetails.founderOrCeo.email": payload.email });

  if (!tempAgent) {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid request"));
  }

  // Check if OTP is correct and not expired
  const isOtpValid = await tempAgent.isOtpCorrect(payload.otp);
  if (!isOtpValid || tempAgent.otpExpiry < Date.now()) {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid or expired OTP"));
  }

  // Once OTP is verified, create a new agent in the Agent collection
  const agentData = {
    companyDetails: tempAgent.companyDetails,
    accountDetails: tempAgent.accountDetails,
    password: tempAgent.password,
  };

  await sendAuthData(payload.email, payload.password);

  const agent = new Agent(agentData);
  await agent.save();
  const createdAgent = await Agent.findById(agent._id).select("-password");

  // Remove the temp agent record
  await TempAgent.deleteOne({ "accountDetails.founderOrCeo.email": payload.email });

  return res.status(201).json(new ApiResponse(201, createdAgent, "Agent registered successfully"));
});

const login = asyncHandler(async (req, res) => {
  const payload = req.body;
  const validation = loginSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors));
  }

  let user;
  let loggedInUser;

  if (payload.role === "3") {
    console.log("Payload email:", payload.email.trim().toLowerCase());
    
    // Query user by email (ensure email is trimmed and lowercased)
    user = await Student.findOne({ email: payload.email.trim().toLowerCase() });
    console.log("Queried user:", user);
    
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }

    // Check if the password is correct
    const isPasswordValid = await user.isPasswordCorrect(payload.password);
    if (!isPasswordValid) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid password"));
    }

    loggedInUser = await Student.findById(user._id).select("-password -refreshToken");

  } else if (payload.role === "2") {
    user = await Agent.findOne({ "accountDetails.founderOrCeo.email": payload.email });
    
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }

    // Check password for agent
    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid password"));
    }

    loggedInUser = await Agent.findById(user._id).select("-password -refreshToken");

  } else {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid user type"));
  }

  let userData = {
    id: user._id,
    email: user.email,
    role: payload.role,
  };

  const { accessToken } = await generateTokens(userData);

  // Set cookies
  const options = {
    httpOnly: true,
    secure: true,
  };
  
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
        },
        "User logged in successfully"
      )
    );
});


const logout = asyncHandler(async (req, res) => {
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const payload = req.body;
  const validation = changePasswordSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors[0].message));
  }
  let user;
  if(req.user.role === '3'){
    user = await Student.findOne({ _id: req.user.id });
    if (!user || !user.approved ) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }
    const hashPassword = await bcrypt.hash(payload.newPassword, 10);
  await Student.findOneAndUpdate(
    { _id: req.user.id },
    {
      $set: {
        password: hashPassword,
      },
    },
    { new: true }
  );
  } else if(req.user.role === '2'){
    user = await Agent.findOne({_id: req.user.id});
     
    if (!user || !user.approved) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }
    const hashPassword = await bcrypt.hash(payload.newPassword, 10);
  await Agent.findOneAndUpdate(
    { _id: req.user.id },
    {
      $set: {
        password: hashPassword,
      },
    },
    { new: true }
  );
  } else {
    return res.status(400).json(
      new ApiResponse(400, {}, "Invalid user type ")
    )
  }
  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if(!isPasswordValid){
    return res.status(400).json(
      new ApiResponse(400, {}, "Invalid password")
    )
  }
  

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password updated successfully"));
});

const approveStudent =  asyncHandler (async (req, res)=>{
  const studentId = req.params.studentId;
  const findStudent = await Student.findOne({_id: studentId});
  if(!findStudent){
    return res.status(404).json(
      new ApiResponse(404, {}, "Student not found")
    )
  }
  await Student.findByIdAndUpdate( 
     { _id: studentId },
    {
      $set: {
        approved: true,
      },
    },
    { new: true });

    return res.status(200).json(
      new ApiResponse(200, {}, "Student approved successfully")
    )
    
})

const requestPasswordResetOtp = asyncHandler(async (req, res) => {

  const payload = req.body;
  // Validate the payload using Zod schema
  const validation = forgotPasswordSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors));
  }

  let tempModel, modelType;

  if (payload.type === '2') {
    // Find and update in the agent model
    modelType = "Agent";
    tempModel = await Agent.findOne({ "accountDetails.founderOrCeo.email": payload.email });
    if (!tempModel) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "No agent found with this email"));
    }
  } else if (payload.type === '3') {
    // Find and update in the student model
    modelType = "Student";
    tempModel = await Student.findOne({ email: payload.email });
    if (!tempModel) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "No student found with this email"));
    }
  } else {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Invalid type provided"));
  }

  // Generate OTP and send it to the user's email
  const OTP = generateOtp();
  await sendEmailVerification(payload.email, OTP);

  // Save OTP and expiry to the appropriate temp record (agent or student)
  if (payload.type === '2') {
    await TempAgent.updateOne(
      { "accountDetails.founderOrCeo.email": payload.email },
      {
        otp: await bcrypt.hash(OTP, 10), // Hash the OTP for security
        otpExpiry: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
      },
      { upsert: true }
    );
  } else if (payload.type === '3') {
    await TempStudent.updateOne(
      { email: payload.email },
      {
        otp: await bcrypt.hash(OTP, 10), // Hash the OTP for security
        otpExpiry: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
      },
      { upsert: true }
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { email: payload.email }, `${modelType} OTP sent to your email`));
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, type } = req.body;

  // Validate the payload using Zod schema
  const validation = verifyOtpSchema.safeParse({ email, otp, type });
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors));
  }

  let tempModel, modelType;

  if (type === '2') {
    // Agent model lookup
    modelType = "Agent";
    tempModel = await TempAgent.findOne({ "accountDetails.founderOrCeo.email": email });
    if (!tempModel) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "No agent found with this email"));
    }
  } else if (type === '3') {
    // Student model lookup
    modelType = "Student";
    tempModel = await TempStudent.findOne({ email });
    if (!tempModel) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "No student found with this email"));
    }
  }

  // Check if OTP has expired
  if (Date.now() > tempModel.otpExpiry) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "OTP has expired"));
  }

  // Verify the OTP using the model's `isOtpCorrect` method
  const isOtpCorrect = await tempModel.isOtpCorrect(otp);
  if (!isOtpCorrect) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Invalid OTP"));
  }

  // Mark OTP as verified
  tempModel.isOtpVerified = true;
  await tempModel.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { email }, `${modelType} OTP verified successfully`));
});


const resetPassword = asyncHandler(async (req, res) => {
  const { email, type, otp, newPassword } = req.body;

  // Validate the payload using Zod schema
  const validation = resetPasswordSchema.safeParse(req.body);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors));
  }

  let tempModel;
  let userModel;
  let emailQuery = {};

  if (type === '2') {
    // Type 2 is Agent - Query structure adjusted for Agent model
    tempModel = TempAgent;
    userModel = Agent;
    emailQuery = { "accountDetails.founderOrCeo.email": email }; // Adjusted query for Agent
  } else if (type === '3') {
    // Type 3 is Student - Adjust query if email is nested
    tempModel = TempStudent;
    userModel = Student;
    
    // Assuming `TempStudent` has the email nested under `studentDetails.email`
    emailQuery = { "email": email }; // Adjust according to actual schema structure
  } else {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Invalid type provided"));
  }

  // Find the temporary user (Agent/Student) by email
  const tempUser = await tempModel.findOne(emailQuery);
  console.log(tempUser, "++++++++++++++++++++++++")
  if (!tempUser) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "User not found or OTP expired"));
  }

  // Verify if OTP is correct and not expired
  const isOtpValid = await tempUser.isOtpCorrect(otp);
  if (!isOtpValid || tempUser.otpExpiry < Date.now()) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Invalid or expired OTP"));
  }

  // Find the actual user (Agent/Student) by email in their respective model
  const user = await userModel.findOne(emailQuery);
  if (!user) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "User not found"));
  }

  // Encrypt the new password
  // const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the password and mark OTP as verified in userModel
  user.password = newPassword;
  user.isOtpVerified = true; // Mark as OTP verified if applicable
  await user.save();

  // Optionally, you may want to delete the temporary OTP record from the Temp collection
  await tempModel.deleteOne(emailQuery);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const resendStudentOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate the payload using Zod schema (if needed)
  const validation = resendOtpSchema.safeParse({ email });
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors));
  }

  // Check if the temporary student exists
  const tempStudent = await TempStudent.findOne({ email });
  if (!tempStudent) {
    return res.status(404).json(new ApiResponse(404, {}, "Student not found"));
  }

  // Generate a new OTP
  const OTP = generateOtp();

  // Send the new OTP to the user's email
  await sendEmailVerification(email, OTP);

  // Update the OTP and OTP expiry in the temporary student record
  tempStudent.otp = OTP;
  tempStudent.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
  await tempStudent.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { email: tempStudent.email }, "OTP resent to your email"));
});


const resendAgentOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate the payload using Zod schema
  const validation = resendOtpSchema.safeParse({ email });
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors));
  }

  // Check if the temporary agent exists
  const tempAgent = await TempAgent.findOne({ "accountDetails.founderOrCeo.email": email });
  if (!tempAgent) {
    return res.status(404).json(new ApiResponse(404, {}, "Agent not found"));
  }

  // Generate a new OTP
  const OTP = generateOtp();

  // Send the new OTP to the agent's email
  await sendEmailVerification(email, OTP);

  // Update the OTP and OTP expiry in the temporary agent record
  tempAgent.otp = await bcrypt.hash(OTP, 10); // Hash the OTP for security
  tempAgent.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
  await tempAgent.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { email: tempAgent.accountDetails.founderOrCeo.email }, "OTP resent to your email"));
});

// Store pending email changes in memory (or use a cache/database)
const pendingEmailChanges = {};
const requestChangeEmail = asyncHandler(async (req, res) => {
  const { newEmail } = req.body;

  // Validate the payload using Zod schema
  const validation = changeEmailSchema.safeParse({ newEmail });
  if (!validation.success) {
    return res.status(400).json(new ApiResponse(400, {}, validation.error.errors));
  }

  const userId = req.user.id; // Assuming you have user ID from authenticated user
  const userRole = req.user.role; // Assuming role is part of the user object

  // Determine if the user is an agent or a student
  let user;
  if (userRole === '2') {
    // Check if the agent exists
    user = await Agent.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "Agent not found"));
    }
  } else if (userRole === '3') {
    // Check if the student exists
    user = await Student.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "Student not found"));
    }
  } else {
    return res.status(403).json(new ApiResponse(403, {}, "Access denied"));
  }

  // Generate an OTP
  const OTP = generateOtp();

  // Send the OTP to the new email
  await sendEmailVerification(newEmail, OTP);

  // Hash the OTP for security and set expiry
  const hashedOtp = await bcrypt.hash(OTP, 10);
  const expiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

  // Generate a unique token for the new email change request
  const token = crypto.randomBytes(16).toString('hex');

  // Store the pending email change with the OTP and expiry
  pendingEmailChanges[token] = {
    userId,
    newEmail,
    otp: hashedOtp,
    expiry,
  };

  return res.status(200).json(new ApiResponse(200, {}, "OTP sent to your new email. Please verify to update your email address."));
});

const verifyAndChangeEmail = asyncHandler(async (req, res) => {
  const { token, otp } = req.body;

  // Validate the payload using Zod schema
  const validation = z.object({
    token: z.string().min(1, "Token is required"),
    otp: z.string().min(6, "OTP must be at least 6 characters long"),
  }).safeParse({ token, otp });

  if (!validation.success) {
    return res.status(400).json(new ApiResponse(400, {}, validation.error.errors));
  }

  // Check if the token exists in pendingEmailChanges
  const pendingChange = pendingEmailChanges[token];
  if (!pendingChange) {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid or expired token."));
  }

  const { userId, newEmail, otp: hashedOtp, expiry } = pendingChange;

  // Check if OTP is expired
  if (Date.now() > expiry) {
    delete pendingEmailChanges[token]; // Remove expired request
    return res.status(400).json(new ApiResponse(400, {}, "OTP has expired. Please request a new one."));
  }

  // Verify the OTP
  const isOtpCorrect = await bcrypt.compare(otp, hashedOtp);
  if (!isOtpCorrect) {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid OTP. Please try again."));
  }

  // Determine if the user is an agent or a student
  const userRole = req.user.role; // Assuming role is part of the user object
  let user;
  if (userRole === '2') {
    // Check if the agent exists
    user = await Agent.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "Agent not found"));
    }
    
    // Update the email in accountDetails
    user.accountDetails.founderOrCeo.email = newEmail; // Update the email to the new one
  } else if (userRole === '3') {
    // Check if the student exists
    user = await Student.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "Student not found"));
    }

    // Update the email (if applicable)
    user.email = newEmail; // Assuming students have a direct email field
  } else {
    return res.status(403).json(new ApiResponse(403, {}, "Access denied"));
  }

  // Save the updated user
  await user.save();

  // Cleanup: Remove the pending change from memory
  delete pendingEmailChanges[token];

  return res.status(200).json(new ApiResponse(200, { email: user.accountDetails.founderOrCeo.email }, "Email updated successfully."));
});






export {requestChangeEmail, verifyAndChangeEmail, resendAgentOtp, resendStudentOtp, verifyStudentOtp, verifyAgentOtp, sendAgentOtp, login, logout, changePassword, approveStudent, sentStudentOtp, requestPasswordResetOtp, resetPassword, verifyOtp };
