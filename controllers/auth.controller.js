import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
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
    user = await Student.findOne({ email: payload.email });
    if (!user || !user.approved ) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }
    const isPasswordValid = await user.isPasswordCorrect(payload.password);
    if (!isPasswordValid) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid password"));
    }
    loggedInUser = await Student.findById(user._id).select(
      "-password -refreshToken"
    );
  } else if (payload.role === "2") {
        
    user = await Agent.findOne({ "accountDetails.founderOrCeo.email": payload.email });
     
    if (!user || !user.approved) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }
    // console.log(user.password)
    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid password"));
    }
    loggedInUser = await Agent.findById(user._id).select(
      "-password -refreshToken"
    );
  } else {
    return res.status(400).json(
      new ApiResponse(400, {}, "Invalid user type")
    )
  }

  let userData = {
    id: user._id,
    email: user.email,
    role: payload.role,
  };
  const { accessToken } = await generateTokens(userData);

  // set cookies
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

  // Find the student by email
  const student = await Student.findOne({ email: payload.email });
  if (!student) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "No student found with this email"));
  }

  // Generate OTP and send it to the user's email
  const OTP = generateOtp();
  await sendEmailVerification(payload.email, OTP);

  // Save OTP and expiry to a temp student record
  await TempStudent.updateOne(
    { email: payload.email },
    {
      otp: OTP,
      otpExpiry: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
    },
    { upsert: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { email: payload.email }, "OTP sent to your email"));
});

 const resetPassword = asyncHandler(async (req, res) => {
  const payload = req.body;

  // Validate the payload using Zod schema
  const validation = resetPasswordSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors));
  }

  // Find the temp student record with email and OTP
  const tempStudent = await TempStudent.findOne({ email: payload.email });
  if (!tempStudent) {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid request"));
  }

  // Check if OTP is correct and not expired
  const isOtpValid = tempStudent.otp === payload.otp;
  if (!isOtpValid || tempStudent.otpExpiry < Date.now()) {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid or expired OTP"));
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // Update the student's password in the Student collection
  await Student.updateOne(
    { email: payload.email },
    { password: hashedPassword }
  );

  // Remove the temp student OTP record
  await TempStudent.deleteOne({ email: payload.email });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
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

export { resendAgentOtp, resendStudentOtp, verifyStudentOtp, verifyAgentOtp, sendAgentOtp, login, logout, changePassword, approveStudent, sentStudentOtp, requestPasswordResetOtp, resetPassword };
