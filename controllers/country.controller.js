import { Country } from "../models/country.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getAllCountries = asyncHandler(async (req, res) => {

    // Fetch all countries from the database
    const countries = await Country.find({});
  
    // Check if countries exist
    if (!countries || countries.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, "No countries found"));
    }
  
    // Return the countries data
    return res.status(200).json(new ApiResponse(200, countries, "Countries fetched successfully"));
  });

  export {getAllCountries}
  