import { Company } from "../models/company.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CompanyContactSchema, CompanyDetailsSchema, CompanyOperationsSchema, CompanyOverviewSchema } from "../validators/company.validator.js";


//register company
const registerCompany = asyncHandler(async (req, res) => {
    const { body: payload } = req;

    // Validate the payload using Zod schema
    const result = CompanyDetailsSchema.safeParse(payload.companyDetails);
    if (!result.success) {
        return res.status(400).json(new ApiResponse(400, {}, result.error.errors));
    }

    // Check if the user role is 'AGENT'
    if (res.user.role !== 'AGENT') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to register a company"));
    }

    const { companyDetails } = payload;

    // Check if a company with the same business name or phone number already exists
    const isCompanyExist = await Company.exists({
        $or: [
            { 'companyDetails.businessName': companyDetails.businessName },
            { 'companyDetails.phoneNumber': companyDetails.phoneNumber }
        ]
    });

    if (isCompanyExist) {
        return res.status(409).json(new ApiResponse(409, {}, "Company with this name or phone number already exists"));
    }

    const newCompany = new Company({
        companyDetails,
        agentId: req.user.id
    });

    await newCompany.save();

    const createdCompany = await Company.findById(newCompany._id).select("-__v");

    return res.status(201).json(new ApiResponse(201, createdCompany, "Company registered successfully"));
});

//register primary contacts 
const registerCompanyContact = asyncHandler(async (req, res) => {
    const { body: payload } = req;

    // Validate the primary contact payload using the PrimaryContactSchema
    const result = PrimaryContactSchema.safeParse(payload.primaryContact);
    if (!result.success) {
        return res.status(400).json(new ApiResponse(400, {}, result.error.errors));
    }

    // Ensure the user role is 'AGENT'
    if (req.user.role !== 'AGENT') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to register a contact"));
    }

    // Check if the agent has a company associated with them
    const company = await Company.findOne({ agentId: req.user.id });
    if (!company) {
        return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
    }

    // Check if a contact with the same email or mobile already exists
    const isContactExist = await Company.exists({
        agentId: req.user.id,
        $or: [
            { 'primaryContact.emailUsername': payload.primaryContact.emailUsername },
            { 'primaryContact.mobile': payload.primaryContact.mobile }
        ]
    });

    if (isContactExist) {
        return res.status(409).json(new ApiResponse(409, {}, "Contact with this email or mobile already exists"));
    }

    // Update the primary contact for the company
    company.primaryContact = payload.primaryContact;

    // Save the updated company details
    await company.save();

    // Retrieve and return the updated primary contact details
    const updatedCompany = await Company.findById(company._id).select("primaryContact -_id");

    return res.status(201).json(new ApiResponse(201, updatedCompany.primaryContact, "Primary contact registered successfully"));
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
    if (req.user.role !== 'AGENT') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to register bank details"));
    }

    // Find the company associated with the agentId
    const company = await Company.findOne({ agentId: req.user.id });
    if (!company) {
        return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
    }

    // Update the bank details for the company
    company.bankDetails = payload;

    // Save the updated company details
    await company.save();

    // Retrieve and return the updated bank details
    const updatedCompany = await Company.findById(company._id).select("bankDetails -_id");

    return res.status(201).json(new ApiResponse(201, updatedCompany.bankDetails, "Bank details registered successfully"));
});

const registerCompanyOverview = asyncHandler(async (req, res) => {
    const { body: payload } = req;

    // Validate the payload using CompanyOverviewSchema
    const result = CompanyOverviewSchema.safeParse(payload);
    if (!result.success) {
        return res.status(400).json(new ApiResponse(400, {}, result.error.errors));
    }

    // Ensure the user role is 'AGENT'
    if (req.user.role !== 'AGENT') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to update the company overview"));
    }

    // Find the company associated with the agentId
    const company = await Company.findOne({ agentId: req.user.id });
    if (!company) {
        return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
    }

    // Update the company overview for the company
    company.companyOverview = payload;

    // Save the updated company details
    await company.save();

    // Retrieve and return the updated company overview
    const updatedCompany = await Company.findById(company._id).select("companyOverview -_id");

    return res.status(200).json(new ApiResponse(200, updatedCompany.companyOverview, "Company overview updated successfully"));
});

const registerCompanyOperations = asyncHandler(async (req, res) => {
    const { body: payload } = req;

    // Validate the payload using CompanyOperationsSchema
    const result = CompanyOperationsSchema.safeParse(payload);
    if (!result.success) {
        return res.status(400).json(new ApiResponse(400, {}, result.error.errors));
    }

    // Ensure the user role is 'AGENT'
    if (req.user.role !== 'AGENT') {
        return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to update company operations"));
    }

    // Find the company associated with the agentId
    const company = await Company.findOne({ agentId: req.user.id });
    if (!company) {
        return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
    }

    // Update the company operations for the company
    company.companyOperations = payload;

    // Save the updated company details
    await company.save();

    // Retrieve and return the updated company operations
    const updatedCompany = await Company.findById(company._id).select("companyOperations -_id");

    return res.status(200).json(new ApiResponse(200, updatedCompany.companyOperations, "Company operations updated successfully"));
});

const registerReferences = asyncHandler(async (req, res) => {
    const { body: payload } = req;
  
    // Validate the payload using ReferenceSchema
    const result = z.array(ReferenceSchema).safeParse(payload);
    if (!result.success) {
      return res.status(400).json(new ApiResponse(400, {}, result.error.errors));
    }
  
    // Ensure the user role is 'AGENT'
    if (req.user.role !== 'AGENT') {
      return res.status(403).json(new ApiResponse(403, {}, "You are not authorized to update references"));
    }
  
    // Find the company associated with the agentId
    const company = await Company.findOne({ agentId: req.user.id });
    if (!company) {
      return res.status(404).json(new ApiResponse(404, {}, "No company found for this agent"));
    }
  
    // Update the references for the company
    company.references = payload;
  
    // Save the updated company details
    await company.save();
  
    // Retrieve and return the updated references
    const updatedCompany = await Company.findById(company._id).select("references -_id");
  
    return res.status(200).json(new ApiResponse(200, updatedCompany.references, "References updated successfully"));
  });

  const getCompanyData = asyncHandler(async (req, res) => {
    // Ensure the user role is 'AGENT'
    if (req.user.role !== 'AGENT') {
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