import { Company } from "../models/company.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { agentRegistrationComplete } from "../utils/mailTemp.js";
import { sendEmailVerification } from "../utils/sendMail.js";
import { BankDetailsSchema, CompanyContactSchema, CompanyDetailsSchema, CompanyOperationsSchema, CompanyOverviewSchema, ReferenceSchema } from "../validators/company.validator.js";
import { z } from 'zod';


// Function to generate unique Application ID
async function generateAgentId() {
  const today = new Date();

  // Format the date components (DDMMYY)
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear().toString().slice(2);

  // Construct the base Agent ID without the sequence number
  const baseId = `AG-${year}${month}${day}`;

  // Find the last created agent with a matching date prefix (e.g., AG-240926)
  const lastAgent = await Company
    .findOne({ agentId: { $regex: `^${baseId}` } })  // Search for existing IDs with the same base
    .sort({ agentId: -1 })  // Sort by descending order to get the last created one
    .exec();

  let sequenceNumber = 1;  // Default sequence number if no match found

  if (lastAgent) {
    // Extract the last two digits (sequence number) from the last agentId
    const lastId = lastAgent.agentId;
    const lastSequence = parseInt(lastId.slice(-2), 10);  // Get the last 2 digits of the agentId
    
    // Increment the sequence number for the new ID
    sequenceNumber = lastSequence + 1;
  }

  // Format the sequence number as a two-digit number
  const sequenceStr = sequenceNumber.toString().padStart(2, '0');

  // Return the unique Agent ID (e.g., AG-24092601)
  return `${baseId}${sequenceStr}`;
}
//register company
const registerCompany = asyncHandler(async (req, res) => {
    const { body: payload } = req;

    // Validate the payload using Zod schema
    const result = CompanyDetailsSchema.safeParse(payload.companyDetails);
    if (!result.success) {
        return res.status(400).json(new ApiResponse(400, {}, result.error.errors));
    }
     
    // Check if the user role is 'AGENT'
    if (req.user.role !== '2') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to register a company"));
    }

    const { companyDetails } = payload;

    // Check if a company with the same business name or phone number already exists
    const isCompanyExist = await Company.findOne({
        $or: [
            { 'companyDetails.businessName': companyDetails.businessName },
            { 'companyDetails.phoneNumber': companyDetails.phoneNumber }
        ]
    });


    if (isCompanyExist && isCompanyExist.agentId.toString() !== req.user.id) {
        return res.status(409).json(new ApiResponse(409, {}, "Company with this name or phone number already exists"));
    }

    if (isCompanyExist && isCompanyExist.agentId.toString() === req.user.id) {
      isCompanyExist.companyDetails = companyDetails;
      await isCompanyExist.save();
      const updatedCompany = await Company.findById(isCompanyExist._id).select("-__v");
      return res.status(200).json(new ApiResponse(200, updatedCompany, "Company updated successfully"));
    }

    // If the company doesn't exist or belongs to a different agent, insert new data
    const newCompany = new Company({
      companyDetails,
      agentId: req.user.id,
      pageCount: 1
    });

    await newCompany.save();

    const createdCompany = await Company.findById(newCompany._id).select("-__v");

    return res.status(201).json(new ApiResponse(201, createdCompany, "Company registered successfully"));
});

//register primary contacts 
const registerCompanyContact = asyncHandler(async (req, res) => {
    const { body: payload } = req;
  
    // Validate the entire payload using the CompanyContactSchema
    const result = CompanyContactSchema.safeParse(payload);
    if (!result.success) {
      return res.status(400).json(new ApiResponse(400, {}, result.error.errors));
    }
  
    // Ensure the user role is 'AGENT'
    if (req.user.role !== '2') {
      return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to register a contact"));
    }
  
    // Check if the agent has a company associated with them
    const company = await Company.findOne({ agentId: req.user.id });
    if (!company) {
      return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
    }
  
    // Update the company's contact details
    company.primaryContact = payload.primaryContact;
    
    // If commissionContact is provided, update it
    if (payload.commissionContact) {
      company.commissionContact = payload.commissionContact;
    }
    
    // If admissionsContacts array is provided, update it
    if (payload.admissionsContacts) {
      company.admissionsContacts = payload.admissionsContacts;
    }
    company.pageCount = 2;
    // Save the updated company details
    await company.save();
  
    // Retrieve and return the updated contact details
    const updatedCompany = await Company.findById(company._id).select("primaryContact commissionContact admissionsContacts -_id pageCount");
  
    return res.status(201).json(new ApiResponse(201, updatedCompany, "Company contacts registered successfully"));
  });
  


// Controller for registering bank details
const registerBankDetails = asyncHandler(async (req, res) => {
    const { body: payload } = req;

    // Validate the payload using BankDetailsSchema
    const result = BankDetailsSchema.safeParse(payload);
    if (!result.success) {
        return res.status(400).json(new ApiResponse(400, {}, result.error.errors));
    }

    // Ensure the user role is 'AGENT'
    if (req.user.role !== '2') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to register bank details"));
    }

    // Find the company associated with the agentId
    const company = await Company.findOne({ agentId: req.user.id });
    if (!company) {
        return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
    }

    // Update the bank details for the company
    company.bankDetails = payload;
    company.pageCount = 3;
    // Save the updated company details
    await company.save();

    // Retrieve and return the updated bank details
    const updatedCompany = await Company.findById(company._id).select("pageCount bankDetails -_id");

    return res.status(201).json(new ApiResponse(201, updatedCompany, "Bank details registered successfully"));
});

const registerCompanyOverview = asyncHandler(async (req, res) => {
    const { body: payload } = req;

    // Validate the payload using CompanyOverviewSchema
    const result = CompanyOverviewSchema.safeParse(payload);
    if (!result.success) {
        return res.status(400).json(new ApiResponse(400, {}, result.error.errors));
    }

    // Ensure the user role is 'AGENT'
    if (req.user.role !== '2') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to update the company overview"));
    }

    // Find the company associated with the agentId
    const company = await Company.findOne({ agentId: req.user.id });
    if (!company) {
        return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
    }

    // Update the company overview for the company
    company.companyOverview = payload;
    company.pageCount = 4;
    // Save the updated company details
    await company.save();

    // Retrieve and return the updated company overview
    const updatedCompany = await Company.findById(company._id).select("companyOverview -_id pageCount");

    return res.status(200).json(new ApiResponse(200, updatedCompany, "Company overview updated successfully"));
});

const registerCompanyOperations = asyncHandler(async (req, res) => {
    const { body: payload } = req;

    // Validate the payload using CompanyOperationsSchema
    const result = CompanyOperationsSchema.safeParse(payload);
    if (!result.success) {
        return res.status(400).json(new ApiResponse(400, {}, result.error.errors));
    }

    // Ensure the user role is 'AGENT'
    if (req.user.role !== '2') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to update company operations"));
    }

    // Find the company associated with the agentId
    const company = await Company.findOne({ agentId: req.user.id });
    if (!company) {
        return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
    }

    // Update the company operations for the company
    company.companyOperations = payload;
    company.pageCount = 5;
    // Save the updated company details
    await company.save();

    // Retrieve and return the updated company operations
    const updatedCompany = await Company.findById(company._id).select("companyOperations -_id pageCount");

    return res.status(200).json(new ApiResponse(200, updatedCompany, "Company operations updated successfully"));
});

const registerReferences = asyncHandler(async (req, res) => {
  const { body: payload } = req;

  // Validate the payload using Zod
  const result = z.array(ReferenceSchema).safeParse(payload);
  if (!result.success) {
    return res.status(400).json(new ApiResponse(400, {}, result.error.errors));
  }

  // Ensure the user role is 'AGENT' (role '2')
  if (req.user.role !== '2') {
    return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to update references"));
  }

  // Debugging: Log the user ID
 

  // Find the company associated with the agentId (try using _id as well)
  let company = await Company.findOne({ agentId: req.user.id });
  if (!company) {
    console.log("Company not found with agentId, trying _id...");
    company = await Company.findById(req.user.id);  // Try using MongoDB _id as a fallback
  }

  

  if (!company) {
    return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
  }

  const temp = agentRegistrationComplete(company.accountDetails.primaryContactPerson.name);
  await sendEmailVerification(company.accountDetails.founderOrCeo.email,"Registration Successful Awaiting Admin Approval", temp);

  // Update the references for the company
  company.agId = await generateAgentId();
  company.references = result.data;
  company.pageCount = 6;
  company.pageStatus.status = 'notapproved';

  // Save the updated company details
  await company.save();

  // Retrieve the updated references (only the references field, excluding `_id`)
  const updatedCompany = await Company.findById(company._id).select("references -_id pageCount");

  return res.status(200).json(new ApiResponse(200, updatedCompany, "References updated successfully"));
});

  const getCompanyData = asyncHandler(async (req, res) => {
    // Ensure the user role is 'AGENT'
    if (req.user.role !== '2') {
      return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to view company data"));
    }
  
    // Find the company associated with the agentId
    const company = await Company.findOne({ agentId: req.user.id });
    if (!company) {
      return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
    }
  
    // Return the company data (excluding the MongoDB ObjectId)
    return res.status(200).json(new ApiResponse(200, company, "Company data fetched successfully"));
  });
  
   


export { registerCompany, registerCompanyContact, registerBankDetails, registerCompanyOverview, registerCompanyOperations, registerReferences, getCompanyData };