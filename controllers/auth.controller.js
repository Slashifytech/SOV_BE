import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import bcrypt from "bcrypt";
import { Agent } from "../models/agent.model.js";
import {
  changePasswordSchema,
  loginSchema,
  registerAgentSchema,
  registerStudentSchema,
} from "../validators/auth.validator.js";
import { generateTokens } from "../utils/genrateToken.js";


const registerStudent = asyncHandler(async (req, res) => {
  const payload = req.body;
  const validation = registerStudentSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors));
  }
  const findStudent = await Student.findOne({ email: payload.email });
  if (findStudent) {
    return res
      .status(409)
      .json(new ApiResponse(409, {}, "Email is already in use"));
  }

  const data = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    country: payload.country,
    phone: {
      code: payload.code,
      number: payload.number,
    },
    studentType: payload.studentType,
    password: payload.password, 
    hearAbout: payload.hearAbout || null
  };

  const student = await Student.create(data);
  const createdStudent = await Student.findById(student._id).select(
    "-password"
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdStudent, "Student registered successfully")
    );
});

const registerAgent = asyncHandler(async (req, res) => {
  const payload = req.body;
  const validation = registerAgentSchema.safeParse(payload);
  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors[0].message));
  }
  const findAgent = await Agent.findOne({
    $or: [
      { "founder.email": payload.founder.email },
      { "primaryContact.email": payload.primaryContact.email },
    ],
  });
  if (findAgent) {
    return res
      .status(409)
      .json(new ApiResponse(409, {}, "Email is already in use"));
  }
   payload.password = await bcrypt.hash(payload.password, 10);
  const agent = await Agent.create(payload);
  const createdAgent = await Agent.findById(agent._id).select("-password");

  return res
    .status(201)
    .json(new ApiResponse(201, createdAgent, "Agent registered successfully"));
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
  if (payload.role === "student") {
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
  } else if (payload.role === "agent") {

      user = await Agent.findOne({ "founder.email": payload.email });
     
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
  if(req.user.role === "STUDENT"){
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
  } else if(req.user.role === "AGENT"){
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

export { registerStudent, registerAgent, login, logout, changePassword, approveStudent };
