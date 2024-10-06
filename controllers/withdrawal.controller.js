import { Withdrawal } from "../models/withdrawal.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { withdrawalDetailsSchema } from "../validators/withdrawal.validator.js";

const withdrawal = asyncHandler(async (req, res) => {
    const { body: payload } = req;
  
    // Validate payload using Zod
    const validation = withdrawalDetailsSchema.safeParse(payload);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0].message;
      return res.status(400).json(new ApiResponse(400, {}, `Validation Error: ${errorMessage}`));
    }
  
    const { withdrawalDetails } = validation.data;
  
    // Check if the withdrawal record already exists for the user
    const existingWithdrawal = await Withdrawal.findOne({ userId:req.user.id });
  
    // If withdrawal record exists for another user, deny access
    if (existingWithdrawal && existingWithdrawal.userId !== req.user.id) {
      return res.status(403).json(new ApiResponse(403, {}, "Unauthorized: You are not allowed to update this record"));
    }
  
    // Prepare data for saving or updating
    const data = {
      userId:req.user.id,
      bankDetails: withdrawalDetails.bankDetails,
      documentUpload: withdrawalDetails.documentUpload,
    };
  
    if (existingWithdrawal) {
      // Update the existing withdrawal record
      const updatedWithdrawal = await Withdrawal.findOneAndUpdate(
        { userId: existingWithdrawal.userId },
        { $set: data },
        { new: true }
      );
  
      return res.status(200).json(new ApiResponse(200, updatedWithdrawal, "Withdrawal details updated successfully"));
    } else {
      // Create a new withdrawal record
      const newWithdrawal = await Withdrawal.create(data);
      return res.status(201).json(new ApiResponse(201, newWithdrawal, "Withdrawal details saved successfully"));
    }
  });

  export {withdrawal}