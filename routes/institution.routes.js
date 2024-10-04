import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getAllApplications, registerCourseFeeApplication, registerGIC, registerOfferLetter } from "../controllers/institution.controller.js";
const router = Router();

router.route("/register-offerletter").post( verifyJwt, registerOfferLetter);
router.route("/register-gic").post( verifyJwt, registerGIC);
router.route("/all").get( verifyJwt, getAllApplications);
router.route("/course-fee-application").post( verifyJwt, registerCourseFeeApplication);
export default router;