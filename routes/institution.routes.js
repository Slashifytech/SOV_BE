import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getAllApplications, registerGIC, registerOfferLetter } from "../controllers/institution.controller.js";
const router = Router();

router.route("/register-offerletter").post( verifyJwt, registerOfferLetter);
router.route("/register-gic").post( verifyJwt, registerGIC);
router.route("/all").get( verifyJwt, getAllApplications);
export default router;