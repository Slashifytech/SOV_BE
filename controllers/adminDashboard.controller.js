import { asyncHandler } from "../utils/asyncHandler.js";
import { Agent } from "../models/agent.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";


// Get total agents count
const getTotalAgentsCount = asyncHandler (async (req, res)=>{
    const totalAgent = await Agent.countDocuments({role: 'AGENT'});
    return res.status(200).json(
        new ApiResponse(200, totalAgent, "Agent count got successfully")
    )
});

// Get all students count 
const getTotalStudentCount = asyncHandler(async (req, res)=>{
    const studentCount = await Student.countDocuments();
    return res.status(200).json(
        new ApiResponse(200, studentCount, "Student count got successfully")
    )
});

export {getTotalAgentsCount, getTotalStudentCount};