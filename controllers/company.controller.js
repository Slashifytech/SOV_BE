import { Agent } from "../models/agent.model.js";
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

  // Format the date components (YYMMDD)
  const year = today.getFullYear().toString().slice(2); // Last 2 digits of the year
  const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero if necessary
  const day = today.getDate().toString().padStart(2, '0'); // Day with leading zero if necessary

  // Construct the base Agent ID (AG-YYMMDD)
  const baseId = `AG-${year}${month}${day}`;

  // Count the number of agents created with the same YYMMDD prefix
  // Use the 'agId' field instead of 'agentId'
  const count = await Company.countDocuments({ agId: { $regex: `^${baseId}` } }).exec();

  // The sequence number is based on the count (0-based index + 1)
  const sequenceNumber = count + 1;

  // Format the sequence number as a two-digit number
  const sequenceStr = sequenceNumber.toString().padStart(2, '0'); // Ensure it's always 2 digits

  // Return the unique Agent ID (e.g., AG-24102101)
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
    const {edit} = req.query;
    let newCompany ;
    if(edit){
     newCompany = new Company({
      companyDetails,
      agentId: req.user.id,
    });
  } else {
    newCompany = new Company({
      companyDetails,
      agentId: req.user.id,
      pageCount: 1
    });
  }

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
    const {edit} = req.query;
    if(!edit){
      company.pageCount = 2;
    }
    
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
    const {edit} = req.query;
    if(!edit){
      company.pageCount = 3;
    }
   
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
    const {edit} = req.query;
     if(!edit){
      company.pageCount = 4;
     }
    
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
    const {edit} = req.query;
    if(!edit){
      company.pageCount = 5;
    }
    
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

  // Find the company associated with the agentId (try using _id as well)
  let company = await Company.findOne({ agentId: req.user.id });
  if (!company) {
    console.log("Company not found with agentId, trying _id...");
    company = await Company.findById(req.user.id);  // Try using MongoDB _id as a fallback
  }

  if (!company) {
    return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
  }


  // Check if edit is present in the query
  const { edit } = req.query;

  if (edit) {
    // If edit is true, update the references without sending the email
    company.references = payload;  // Assuming the whole reference array is being replaced
  } else {
    // console.log("++++++>>>>>>>")
    // console.log(await generateAgentId(), "++++++++++++" )
    // Insert new references
    company.references = result.data;  // Insert the validated references
    company.pageStatus.status = 'notapproved';  // Set status to notapproved
    company.agId = await generateAgentId();  // Generate and assign a new agentId
    company.pageCount = 6;  // Set the page count to 6 (this is based on your logic)
    
    // Ensure primaryContact is present before accessing it
  if (!company.primaryContact) {
    return res.status(400).json(new ApiResponse(400, {}, "Primary contact details are missing in company profile"));
  }

    // Only send the email if not editing
    const temp = agentRegistrationComplete(company.primaryContact.firstName);

    if (company.primaryContact.emailUsername) {
      await sendEmailVerification(
        company.primaryContact.emailUsername,
        "Registration Successful Awaiting Admin Approval",
        temp
      );
    } else {
      return res.status(400).json(new ApiResponse(400, {}, "Founder or CEO's email is missing"));
    }
  }

  // Save the updated company details
  await company.save();

  // Retrieve the updated references (only the references field, excluding `_id`)
  const updatedCompany = await Company.findById(company._id).select("references -_id pageCount");

  return res.status(200).json(new ApiResponse(200, updatedCompany, "References updated successfully"));
});



const getCompanyData = asyncHandler(async (req, res) => {
  if (req.user.role !== '2') {
    return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to view company data"));
  }

  const company = await Company.findOne({ agentId: req.user.id });
  if (!company) {
    return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
  }

  const agent = await Agent.findById(company.agentId);
  if (!agent) {
    return res.status(404).json(new ApiResponse(404, {}, "Agent not found"));
  }

  const agentEmail = agent.accountDetails?.founderOrCeo?.email || "N/A";
  const agentPhone = agent.accountDetails?.founderOrCeo?.phone || "N/A";

  // Combine company data with agentEmail and agentPhone
  const responseData = {
    ...company.toObject(), // Convert the company document to a plain object
    agentEmail,
    agentPhone,
  };

  // Return the combined data in the response
  return res.status(200).json(new ApiResponse(200, responseData, "Company data fetched successfully"));
});


export { registerCompany, registerCompanyContact, registerBankDetails, registerCompanyOverview, registerCompanyOperations, registerReferences, getCompanyData };