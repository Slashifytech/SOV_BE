import { Institution } from "../models/institution.model.js";
import { StudentInformation } from "../models/studentInformation.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CourseFeeApplicationSchema, GICSchema, OfferLetterSchema } from "../validators/institution.validator.js";
import mongoose from 'mongoose';

// Function to generate unique Application ID
async function generateApplicationId() {
    const today = new Date();
  
    // Format the date components (DDMMYY)
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(2);
  
    // Construct the base Application ID without the sequence number
    const baseId = `AP-${year}${month}${day}`;
  
    // Find the last created application with a matching date prefix (e.g., AP-240926)
    const lastInstitution = await Institution
      .findOne({ applicationId: { $regex: `^${baseId}` } })  // Search for existing IDs with the same base
      .sort({ applicationId: -1 })  // Sort by descending order to get the last created one
      .exec();
  
    let sequenceNumber = 1;  // Default sequence number
  
    if (lastInstitution) {
      // Extract the last two digits (sequence number) from the last applicationId
      const lastId = lastInstitution.applicationId;
      const lastSequence = parseInt(lastId.slice(-2), 10);  // Get the last 2 digits of the applicationId
      
      // Increment the sequence number for the new ID
      sequenceNumber = lastSequence + 1;
    }
  
    // Format the sequence number as a two-digit number
    const sequenceStr = sequenceNumber.toString().padStart(2, '0');
  
    // Return the unique Application ID (e.g., AP-24092601)
    return `${baseId}${sequenceStr}`;
  }

const registerOfferLetter = asyncHandler(async (req, res) => {
    const { body: payload, user } = req;

    // Validate the payload using Zod schema
    const validation = OfferLetterSchema.safeParse(payload.offerLetter);
    if (!validation.success) {
        return res.status(400).json(new ApiResponse(400, {}, validation.error.errors));
    }
    
    // Find student information based on provided ID
    const studentInformation = await StudentInformation.findOne({_id:payload.offerLetter.studentInformationId});
    if (!studentInformation) {
        return res.status(404).json(new ApiResponse(404, {}, "Student information not found"));
    }
    // Check authorization based on user role and student/agent ID
    const isAgentAuthorized = user.role === '2' && studentInformation.agentId?.toString() === user.id;
    const isStudentAuthorized = user.role === '3' && studentInformation.studentId?.toString() === user.id;
    
    if (!(isAgentAuthorized || isStudentAuthorized)) {
        return res.status(403).json(new ApiResponse(403, {}, "Unauthorized user"));
    }

    // Generate unique application ID
    const applicationId = await generateApplicationId();

    // Create a new offer letter document
    const newOffer = await Institution.create({
        offerLetter: payload.offerLetter,
        studentInformationId: payload.offerLetter.studentInformationId,
        applicationId,
        userId: req.user.id
    });

    // Retrieve the created offer letter excluding the __v field
    const createdOffer = await Institution.findById(newOffer._id).select("-__v").exec();

    // Return success response
    return res.status(201).json(new ApiResponse(201, createdOffer, "Offer letter registered successfully"));
});

const registerGIC = asyncHandler(async (req, res) => {
    const { body: payload, user } = req;

    // Validate the payload using Zod schema
    const validation = GICSchema.safeParse(payload.gic);
    if (!validation.success) {
        return res.status(400).json(new ApiResponse(400, {}, validation.error.errors));
    }

    // Find student information based on provided ID
    const studentInformation = await StudentInformation.findOne({_id: payload.gic.studentInformationId});
    if (!studentInformation) {
        return res.status(404).json(new ApiResponse(404, {}, "Student information not found"));
    }

    // Check authorization based on user role and student/agent ID
    const isAgentAuthorized = user.role === '2' && studentInformation.agentId?.toString() === user.id;
    const isStudentAuthorized = user.role === '3' && studentInformation.studentId?.toString() === user.id;

    if (!(isAgentAuthorized || isStudentAuthorized)) {
        return res.status(403).json(new ApiResponse(403, {}, "Unauthorized user"));
    }

    const applicationId = await generateApplicationId();

    // Create a new GIC document
    const newGIC = await Institution.create({
        gic: payload.gic,
        studentInformationId: payload.gic.studentInformationId,
        applicationId,
        userId: req.user.id
    });

    // Retrieve the created GIC excluding the __v field
    const createdGIC = await Institution.findById(newGIC._id).select("-__v").exec();

    // Return success response
    return res.status(201).json(new ApiResponse(201, createdGIC, "GIC registered successfully"));
});

const getAllApplications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Initialize the query object
    const query = { userId: req.user.id };

    // Create an array to hold the $or conditions
    const orConditions = [];

    // Add filters for offerLetter if they are provided
    if (req.query.applicationId) {
        query.applicationId = req.query.applicationId;
    }
    if (req.query.fullName) {
        // Add condition for fullName in offerLetter and gic using $or
        orConditions.push(
            { 'offerLetter.personalInformation.fullName': { $regex: req.query.fullName, $options: 'i' } },
            { 'gic.personalDetails.fullName': { $regex: req.query.fullName, $options: 'i' } }
        );
    }
    if (req.query.phoneNumber) {
        // Add condition for phoneNumber in offerLetter and gic using $or
        orConditions.push(
            { 'offerLetter.personalInformation.phoneNumber': req.query.phoneNumber },
            { 'gic.personalDetails.phoneNumber': req.query.phoneNumber }
        );
    }
    if (req.query.institution) {
        // Add institution filter for offerLetter
        query['offerLetter.preferences.institution'] = { $regex: req.query.institution, $options: 'i' };
    }
    if (req.query.country) {
        // Add country filter for offerLetter
        query['offerLetter.preferences.country'] = { $regex: req.query.country, $options: 'i' };
    }
    
    // Add status filter if provided
    if (req.query.status) {
        // Use $in to allow for multiple status values
        const validStatuses = ['underreview', 'completed', 'reject', 'pending', 'approved'];
        if (validStatuses.includes(req.query.status)) {
            query.$or = [
                { 'offerLetter.status': req.query.status },
                { 'gic.status': req.query.status }
            ];
        } else {
            return res.status(400).json(new ApiResponse(400, {}, "Invalid status filter provided."));
        }
    }

    // Add filter for specific application types
    if (req.query.filterType) {
        switch (req.query.filterType.toLowerCase()) {
            case 'offerletter':
                // Filter for Offer Letter applications
                query['offerLetter'] = { $exists: true };
                break;
            case 'coursefeeapplication':
                // Filter for Course Fee Applications
                query['courseFeeApplication'] = { $exists: true };
                break;
            case 'visa':
                // Filter for Visa applications (assuming this means GIC status or similar)
                query['gic'] = { $exists: true };
                break;
            case 'all':
                // No additional filters, show all
                break;
            default:
                return res.status(400).json(new ApiResponse(400, {}, "Invalid filter type provided."));
        }
    }

    // If there are any OR conditions, merge them with the main query using $or
    if (orConditions.length > 0) {
        query.$or = orConditions;
    }

    // Fetch paginated applications with the applied filters
    const applications = await Institution.find(query)
        .select("-__v") // Exclude __v field
        .skip(skip)
        .limit(limit)
        .exec();

    // Get the total number of applications for pagination
    const totalApplications = await Institution.countDocuments(query);

    // Transform applications to include only populated fields (offerLetter, gic, courseFeeApplication)
    const transformedApplications = applications.map(app => {
        const transformedApp = {
            applicationId: app.applicationId,
            userId: app.userId,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
        };

        // Only include the field if it has a value
        if (app.offerLetter && Object.keys(app.offerLetter).length > 0) {
            transformedApp.offerLetter = app.offerLetter;
        }
        if (app.gic && Object.keys(app.gic).length > 0) {
            transformedApp.gic = app.gic;
        }
        if (app.courseFeeApplication && Object.keys(app.courseFeeApplication).length > 0) {
            transformedApp.courseFeeApplication = app.courseFeeApplication;
        }

        return transformedApp;
    });

    // Return a success response with paginated data and pagination info
    return res.status(200).json(
        new ApiResponse(200, {
            applications: transformedApplications,
            currentPage: page,
            totalPages: Math.ceil(totalApplications / limit),
            totalApplications,
        }, "Data fetched successfully")
    );
});


const registerCourseFeeApplication = asyncHandler(async (req, res) => {
    const { body: payload, user } = req;

    // Validate the payload using the Zod schema
    const validation = CourseFeeApplicationSchema.safeParse(payload.courseFeeApplication);
    if (!validation.success) {
        return res.status(400).json(new ApiResponse(400, {}, validation.error.errors));
    }

    // Find student information based on the provided studentInformationId
    const studentInformation = await StudentInformation.findOne({ _id: payload.courseFeeApplication.studentInformationId });
    if (!studentInformation) {
        return res.status(404).json(new ApiResponse(404, {}, "Student information not found"));
    }

    // Check authorization based on user role and student/agent ID
    const isAgentAuthorized = user.role === '2' && studentInformation.agentId?.toString() === user.id;
    const isStudentAuthorized = user.role === '3' && studentInformation.studentId?.toString() === user.id;

    if (!(isAgentAuthorized || isStudentAuthorized)) {
        return res.status(403).json(new ApiResponse(403, {}, "Unauthorized user"));
    }

    const applicationId = await generateApplicationId();

    // Create a new course fee application document
    const newCourseFeeApplication = await Institution.create({
        courseFeeApplication: payload.courseFeeApplication,
        studentInformationId: payload.courseFeeApplication.studentInformationId,
        applicationId,
        userId: req.user.id
    });

    // Retrieve the created course fee application excluding the __v field
    const createdCourseFeeApplication = await Institution.findById(newCourseFeeApplication._id).select("-__v").exec();

    // Return success response
    return res.status(201).json(new ApiResponse(201, createdCourseFeeApplication, "Course Fee Application registered successfully"));
});
const applicationOverview = asyncHandler(async (req, res) => {
    const aggregationResult = await Institution.aggregate([
      {
        $lookup: {
          from: 'studentinformations',
          localField: 'studentInformationId',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $unwind: '$studentInfo'
      },
      {
        $match: {
          'studentInfo.agentId': req.user.id  // Matching with logged-in agent's ID
        }
      },
      {
        $group: {
          _id: '$studentInfo._id',
          institutionId: { $first: '$_id' }, // Include Institution _id
          stId: { $first: '$studentInfo.stId' }, // Include stId from StudentInformation
          firstName: { $first: '$studentInfo.personalInformation.firstName' },
          totalCount: { $sum: 1 },
          underReviewCount: {
            $sum: { $cond: [{ $eq: ['$offerLetter.status', 'underreview'] }, 1, 0] }
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$offerLetter.status', 'approved'] }, 1, 0] }
          }
        }
      }
    ]);
  
    // Step 2: Format and send the response
    const studentOverview = aggregationResult.map(result => ({
      institutionId: result.institutionId,   // Return Institution _id
      stId: result.stId,                    // Return stId
      firstName: result.firstName,
      studentInformationId: result._id,
      totalCount: result.totalCount,
      underReviewCount: result.underReviewCount,
      approvedCount: result.approvedCount
    }));
  
    return res.status(200).json(new ApiResponse(200, {
      studentOverView: studentOverview
    }, "Data fetched successfully"));
  });
  
  

  const editPersonalInformation = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { section, personalInformation } = req.body;

    if (!['offerLetter', 'gic'].includes(section)) {
        return res.status(400).json(new ApiResponse(400, {}, 'Invalid section. Use "offerLetter" or "gic".'))    }

    const institution = await Institution.findOne({ _id: applicationId });
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found.' });
    }

    if (section === 'offerLetter') {
      institution.offerLetter.personalInformation = personalInformation;
    } else if (section === 'gic') {
      institution.gic.personalDetails = personalInformation;
    }

    const data =  await institution.save();
      return res.status(200).json(new ApiResponse(200, data, "Personal information updated successfully."))
    
});

const editEducationDetails = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { section, educationDetails } = req.body;

    // Ensure valid section ('offerLetter' in this case)
    if (section !== 'offerLetter') {
        return res.status(400).json(new ApiResponse(400, {}, 'Invalid section. Use "offerLetter" for updating education details.'));
    }

    // Find the Institution by applicationId
    const institution = await Institution.findOne({ _id: applicationId });
    if (!institution) {
        return res.status(404).json(new ApiResponse(404, {}, 'Institution not found.'));
    }

    // Update education details if section is 'offerLetter'
    institution.offerLetter.educationDetails = educationDetails;

    // Save the updated document to the database
    const data = await institution.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, data, 'Education details updated successfully.'));
});

const editPreferences = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { section, preferences } = req.body;

    // Ensure valid section ('offerLetter' in this case)
    if (section !== 'offerLetter') {
        return res.status(400).json(new ApiResponse(400, {}, 'Invalid section. Use "offerLetter" for updating preferences.'));
    }

    // Find the Institution by applicationId
    const institution = await Institution.findOne({ _id: applicationId });
    if (!institution) {
        return res.status(404).json(new ApiResponse(404, {}, 'Institution not found.'));
    }

    // Update preferences if section is 'offerLetter'
    institution.offerLetter.preferences = preferences;

    // Save the updated document to the database
    const data = await institution.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, data, 'Preferences updated successfully.'));
});

const editIELTSScore = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { section, ieltsScore } = req.body;

    // Ensure valid section ('offerLetter' in this case)
    if (section !== 'offerLetter') {
        return res.status(400).json(new ApiResponse(400, {}, 'Invalid section. Use "offerLetter" for updating IELTS score.'));
    }

    // Find the Institution by applicationId
    const institution = await Institution.findOne({ _id: applicationId });
    if (!institution) {
        return res.status(404).json(new ApiResponse(404, {}, 'Institution not found.'));
    }

    // Update IELTS score if section is 'offerLetter'
    institution.offerLetter.ieltsScore = ieltsScore;

    // Save the updated document to the database
    const data = await institution.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, data, 'IELTS score updated successfully.'));
});


const editPTEScore = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { section, ptes } = req.body;

    // Ensure valid section ('offerLetter' in this case)
    if (section !== 'offerLetter') {
        return res.status(400).json(new ApiResponse(400, {}, 'Invalid section. Use "offerLetter" for updating PTE score.'));
    }

    // Find the Institution by applicationId
    const institution = await Institution.findOne({ _id: applicationId });
    if (!institution) {
        return res.status(404).json(new ApiResponse(404, {}, 'Institution not found.'));
    }

    // Update PTE score if section is 'offerLetter'
    institution.offerLetter.ptes = ptes;

    // Save the updated document to the database
    const data = await institution.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, data, 'PTE score updated successfully.'));
});

const editTOEFLScore = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { section, toefl } = req.body;

    // Ensure valid section ('offerLetter' in this case)
    if (section !== 'offerLetter') {
        return res.status(400).json(new ApiResponse(400, {}, 'Invalid section. Use "offerLetter" for updating TOEFL score.'));
    }

    // Find the Institution by applicationId
    const institution = await Institution.findOne({ _id: applicationId });
    if (!institution) {
        return res.status(404).json(new ApiResponse(404, {}, 'Institution not found.'));
    }

    // Update TOEFL score if section is 'offerLetter'
    institution.offerLetter.toefl = toefl;

    // Save the updated document to the database
    const data = await institution.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, data, 'TOEFL score updated successfully.'));
});

const editCertificate = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { section, certificates } = req.body;

    // Ensure valid section ('offerLetter' in this case)
    if (section !== 'offerLetter') {
        return res.status(400).json(new ApiResponse(400, {}, 'Invalid section. Use "offerLetter" for updating certificates.'));
    }

    // Find the Institution by applicationId
    const institution = await Institution.findOne({ _id: applicationId });
    if (!institution) {
        return res.status(404).json(new ApiResponse(404, {}, 'Institution not found.'));
    }

    // Update the certificate array if section is 'offerLetter'
    institution.offerLetter.certificate.url = certificates;

    // Save the updated document to the database
    const data = await institution.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, data, 'Certificates updated successfully.'));
});


const editStudentDocument = asyncHandler(async (req, res) => {
    const { applicationId } = req.params; // Extract applicationId from URL parameters
    const { aadharCard, panCard } = req.body; // Extract fields to be updated from the request body

    // Find the Institution by applicationId
    const institution = await Institution.findOne({_id: applicationId });
    if (!institution) {
        return res.status(404).json(new ApiResponse(404, {}, 'Institution not found.'));
    }

    // Update the studentDocument fields
    institution.courseFeeApplication.studentDocument.aadharCard = aadharCard || institution.courseFeeApplication.studentDocument.aadharCard;
    institution.courseFeeApplication.studentDocument.panCard = panCard || institution.courseFeeApplication.studentDocument.panCard;

    // Save the updated document to the database
    const data = await institution.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, data, 'Student document updated successfully.'));
});

const editParentDocument = asyncHandler(async (req, res) => {
    const { applicationId } = req.params; // Extract applicationId from URL parameters
    const { fatherAadharCard, fatherPanCard, motherAadharCard, motherPanCard } = req.body; // Extract fields to be updated from the request body

    // Find the Institution by applicationId
    const institution = await Institution.findOne({_id: applicationId });
    if (!institution) {
        return res.status(404).json(new ApiResponse(404, {}, 'Institution not found.'));
    }

    // Update the parentDocument fields
    institution.courseFeeApplication.parentDocument.fatherAadharCard = fatherAadharCard || institution.courseFeeApplication.parentDocument.fatherAadharCard;
    institution.courseFeeApplication.parentDocument.fatherPanCard = fatherPanCard || institution.courseFeeApplication.parentDocument.fatherPanCard;
    institution.courseFeeApplication.parentDocument.motherAadharCard = motherAadharCard || institution.courseFeeApplication.parentDocument.motherAadharCard;
    institution.courseFeeApplication.parentDocument.motherPanCard = motherPanCard || institution.courseFeeApplication.parentDocument.motherPanCard;

    // Save the updated document to the database
    const data = await institution.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, data, 'Parent document updated successfully.'));
});

const editOfferLetterAnsPassport = asyncHandler(async (req, res) => {
    const { applicationId } = req.params; // Extract applicationId from URL parameters
    const { offerLetter, passport } = req.body; // Extract fields to be updated from the request body

    // Find the Institution by applicationId
    const institution = await Institution.findOne({ _id: applicationId });
    if (!institution) {
        return res.status(404).json(new ApiResponse(404, {}, 'Institution not found.'));
    }

    // Update the offerLetterAnsPassport fields
    institution.courseFeeApplication.offerLetterAnsPassport.offerLetter = offerLetter || institution.courseFeeApplication.offerLetterAnsPassport.offerLetter;
    institution.courseFeeApplication.offerLetterAnsPassport.passport = passport || institution.courseFeeApplication.offerLetterAnsPassport.passport;

    // Save the updated document to the database
    const data = await institution.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, data, 'Offer letter and passport information updated successfully.'));
});

const getApplicationById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Fetch application by ID
    const application = await Institution.findById(id);

    // If application doesn't exist, return 404
    if (!application) {
        return res.status(404).json(new ApiResponse(404, {}, "Application not found"));
    }

    // Return offerLetter or gic if available
    const response = application.offerLetter || application.gic;

    // If neither offerLetter nor gic exists, return 404
    if (!response) {
        return res.status(404).json(new ApiResponse(404, {}, "Neither offer letter nor GIC details found"));
    }

    // Return the appropriate data
    const message = application.offerLetter ? "Offer letter fetched successfully" : "GIC details fetched successfully";
    return res.status(200).json(new ApiResponse(200, response, message));
});

const getStudentAllApplications = asyncHandler(async (req, res) => {
    const { studentInformationId } = req.params;

    // Fetch all applications for the given studentInformationId
    const applications = await Institution.find({ studentInformationId });

    // If no applications are found
    if (!applications || applications.length === 0) {
        return res.status(404).json(new ApiResponse(404, {}, "No applications found for the given studentInformationId"));
    }

    // Map through the applications to return only offerLetter or gic if they exist
    const result = applications.map(application => {
        // Only return offerLetter or gic
        if (application.offerLetter) {
            return {
                ...application.toObject(),
                offerLetter: application.offerLetter,
                gic: undefined // Remove gic if offerLetter is present
            };
        }

        if (application.gic) {
            return {
                ...application.toObject(),
                offerLetter: undefined, // Remove offerLetter if gic is present
                gic: application.gic
            };
        }

        // If neither offerLetter nor gic is found, return the whole application
        return {
            ...application.toObject(),
            offerLetter: undefined,
            gic: undefined
        };
    });

    // Return the modified applications
    return res.status(200).json(new ApiResponse(200, result, "Applications fetched successfully"));
});






export {registerOfferLetter, registerGIC, getAllApplications, registerCourseFeeApplication, applicationOverview, editPersonalInformation, editEducationDetails, editPreferences, editIELTSScore, editPTEScore, editTOEFLScore, editCertificate, editStudentDocument, editOfferLetterAnsPassport, editParentDocument, getApplicationById, getStudentAllApplications};
