import mongoose from 'mongoose';
import connectDb from '../db/index.js';
import { Course } from '../models/course.model.js';
import { courseData } from './courseData.js';

async function insertInstitutes() {
  try {
    // Connect to the database
    await connectDb();

    // Insert data into the database
    await Course.insertMany(courseData);
    console.log('Course inserted successfully!');
  } catch (error) {
    console.error('Error inserting Course:', error);
  } finally {
    // Disconnect from the database
    mongoose.connection.close();
  }
}

insertInstitutes();
