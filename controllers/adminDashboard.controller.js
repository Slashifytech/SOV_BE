import { asyncHandler } from "../utils/asyncHandler.js";
import { Agent } from "../models/agent.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { StudentInformation } from "../models/studentInformation.model.js";


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

const changeStudentInformationStatus = asyncHandler(async (req, res) => {
    const { studentInformationId } = req.params; // Assuming studentId is passed as a URL parameter
    const { status, message } = req.body; // Extract status and optional message from the request body

    // Validate that status is provided
    if (!status) {
        return res.status(400).json(
            new ApiResponse(400, {}, "status is required")
        );
    }

    // Find the student information by studentId
    const studentInfo = await StudentInformation.findOne({ _id:studentInformationId });
    if (!studentInfo) {
        return res.status(404).json(
            new ApiResponse(404, {}, "Student information not found")
        );
    }

    // Update the status and message
    studentInfo.pageStatus.status = status;
    if (message) {
        studentInfo.pageStatus.message = message; // Update message if provided
    }

    // Save the updated student information
    await studentInfo.save();

    // Respond with a success message
    return res.status(200).json(
        new ApiResponse(200, { studentInfo }, "Student information status updated successfully")
    );
});

export {getTotalAgentsCount, getTotalStudentCount, changeStudentInformationStatus};