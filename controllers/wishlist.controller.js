import { Institute } from "../models/institute.model.js";
import { Wishlist } from "../models/wishlist.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";




const addToWishlist = asyncHandler(async(req, res)=>{
    const { instituteId } = req.body;
    const userId = req.user.id;  // Assuming you're getting the user ID from the authenticated user
    
    // Check if the institute exists
    const institute = await Institute.findById(instituteId);
    if (!institute) {
      return res.status(404).json( new ApiResponse(404, {}, "Institute not found"));
    }

    // Add institute to wishlist or update the existing wishlist
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, institutes: [instituteId] });
    } else if (!wishlist.institutes.includes(instituteId)) {
      wishlist.institutes.push(instituteId);
    }

    await wishlist.save();
    return res.status(200).json(
        new ApiResponse(200, wishlist, "Institute added to wishlist" )
    )   
    
})

 const removeFromWishlist = asyncHandler(async (req, res) => {
    const { instituteId } = req.params;
    const userId = req.user.id;  // Assuming you're getting the user ID from the authenticated user
  
    // Find the user's wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json(new ApiResponse(404, {}, "Wishlist not found"));
    }
  
    // Filter out the institute from the wishlist
    wishlist.institutes = wishlist.institutes.filter(id => id.toString() !== instituteId);
    
    // Save the updated wishlist
    await wishlist.save();
  
    return res.status(200).json(
      new ApiResponse(200, wishlist, "Institute removed from wishlist")
    );
  });

   const fetchWishlist = asyncHandler(async (req, res) => {
    const userId = req.user.id;  // Assuming you're getting the user ID from the authenticated user
  
    // Find the user's wishlist and populate institute details
    const wishlist = await Wishlist.findOne({ userId }).populate("institutes");
    if (!wishlist) {
      return res.status(404).json(new ApiResponse(404, {}, "Wishlist not found"));
    }
  
    // Return the wishlist
    return res.status(200).json(
      new ApiResponse(200, wishlist, "Wishlist fetched successfully")
    );
  });

export {addToWishlist, removeFromWishlist, fetchWishlist}