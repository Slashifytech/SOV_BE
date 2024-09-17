import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { Agent } from "../models/agent.model.js";

const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
  
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");
    
    if (!token) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Unauthorized request"));
    }

    const decodeToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );
    let user;
    if (decodeToken.role === "student") {
      user = await Student.findById(decodeToken.id).select(
        "-password -refreshToken"
      );
    } else if (decodeToken.role === "agent") {
      user = await Agent.findById(decodeToken.id).select(
        "-password -refreshToken"
      );
    }

    if (!user) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Invalid accessToken"));
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(new ApiResponse(401, {}, "Unauthorized user"));
  }
});

const verifyAdmin = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");

    if (!token) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Unauthorized request"));
    }

    const decodeToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );
    let user;
    if (decodeToken.role === "admin") {
      user = await Agent.findById(decodeToken.id).select(
        "-password -refreshToken"
      );
    }

    if (user.role !== "ADMIN") {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Unauthorized user"));
    }

    if (!user) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Invalid accessToken"));
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(new ApiResponse(401, {}, "Unauthorized user"));
  }
});

export { verifyJwt, verifyAdmin };
