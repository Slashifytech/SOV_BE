import { Admin } from "../models/admin.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateTokens } from "../utils/genrateToken.js";
import { changeEmailSchema, changePasswordSchema, editDataSchema, loginSchema } from "../validators/admin.validator.js";
import bcrypt from "bcrypt";

const adminLogin = asyncHandler(async (req, res) => {
  const payload = req.body;
  const validation = loginSchema.safeParse(payload);

  if (!validation.success) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, validation.error.errors));
  }

  const user = await Admin.findOne({
    email: payload.email.trim().toLowerCase(),
  });
  if (!user) {
    return response.status(404).json(404, {}, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(payload.password);
  if (!isPasswordValid) {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid password"));
  }

  const loggedInUser = await Admin.findById(user._id).select("-password");

  let userData = {
    id: user._id,
    email: user.email,
    role: payload.role,
  };

  const { accessToken } = await generateTokens(userData);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
        },
        "Admin logged in successfully"
      )
    );
});

const changePassword = asyncHandler(async(req, res)=>{
    const payload = req.body;
    const validation = changePasswordSchema.safeParse(payload);
  
    if (!validation.success) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, validation.error.errors));
    }

    const user = await Admin.findOne({ _id: req.user.id });
    if (!user ) {
        return res.status(404).json(new ApiResponse(404, {}, "User not found"));
      }
     
      const isPasswordValid = await bcrypt.compare(payload.oldPassword, user.password);
      if(!isPasswordValid){
        return res.status(400).json(
          new ApiResponse(400, {}, "Invalid password")
        )
      }

      const hashPassword = await bcrypt.hash(payload.newPassword, 10);

      await Admin.findOneAndUpdate(
        { _id: req.user.id },
        {
          $set: {
            password: hashPassword,
          },
        },
        { new: true }
      );

      return res
    .status(200)
    .json(new ApiResponse(200, {}, "password updated successfully"));

}); 

const changeAdminEmail = asyncHandler(async(req,res)=>{
    const payload = req.body;
    const validation = changeEmailSchema.safeParse(payload);
  
    if (!validation.success) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, validation.error.errors));
    }

    const user = await Admin.findOne({ _id: req.user.id });
    if (!user ) {
        return res.status(404).json(new ApiResponse(404, {}, "User not found"));
      }

      const isPasswordValid = await bcrypt.compare(payload.password, user.password);
      if(!isPasswordValid){
        return res.status(400).json(
          new ApiResponse(400, {}, "Invalid password")
        )
      }
     
      await Admin.findOneAndUpdate(
        { _id: req.user.id },
        {
          $set: {
            email: payload.email,
          },
        },
        { new: true }
      );

      const updatedUser = await Admin.findById(user._id).select("-password");
      return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "email updated successfully"));

});

const editProfile = asyncHandler(async(req, res)=>{
    const payload = req.body;

    // Validate the incoming data
    const validation = editDataSchema.safeParse(payload);
    if (!validation.success) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, validation.error.errors));
    }
  
    // Find the admin by their user ID (assuming req.user is populated by middleware)
    const admin = await Admin.findOne({ _id: req.user.id });
    if (!admin) {
      return res.status(404).json(new ApiResponse(404, {}, "Admin not found"));
    }
  
    // Update the allowed fields (excluding email and password)
    const updatedData = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      dob: payload.dob,
      phone: payload.phone,
      profilePicture: payload.profilePicture,
      role: payload.role,
    };
  
    // Perform the update
    const updatedAdmin = await Admin.findOneAndUpdate(
      { _id: req.user.id },
      { $set: updatedData },
      { new: true } // Return the updated document
    ).select("-password"); // Exclude the password from the response
  
    return res
      .status(200)
      .json(new ApiResponse(200, updatedAdmin, "Admin data updated successfully"));
  
})

const getProfileData = asyncHandler(async(req, res)=>{
    const id = req.user.id;
    const user = await Admin.findById(id).select("-password");
     
    if(!user){
        return res.status(404).json( new ApiResponse(404, {}, "user not found") );
    }
 
     return response.status(200).json( new ApiResponse(200, user, "data fetched successfull") );
})

export { adminLogin, changePassword, changeAdminEmail, editProfile, getProfileData };
