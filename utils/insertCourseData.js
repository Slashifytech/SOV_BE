// insertCourses.js
import mongoose from "mongoose";
import connectDb from "../db/index.js"; // Adjust this path as necessary
import { Institute } from "../models/institute.model.js"; // Adjust this path as necessary
import { courses } from "./courseData.js";

// Async IIFE to insert new course data into the courses field for all institutes
(async () => {
  try {
    // Connect to the database
    await connectDb();

    // Update the courses field for all institutes
    const updateResult = await Institute.updateMany(
      {}, // No filter, so it will update all documents
      { $addToSet: { courses: { $each: courses } } } // Add new courses, avoiding duplicates
    );

    console.log("Number of institutes updated:", updateResult.modifiedCount);

  } catch (error) {
    console.error("Error inserting course data:", error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
})();
