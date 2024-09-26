import { Router } from "express";
import { getAllCountries, getPreferredCountries } from "../controllers/country.controller.js";
const router = Router();

router.route("/all").get( getAllCountries);
router.route("/preferred").get( getPreferredCountries);

export default router;