import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getCompanyData, registerBankDetails, registerCompany, registerCompanyContact, registerCompanyOperations, registerCompanyOverview } from "../controllers/company.controller.js";
const router = Router();

router.route("/register-company").post(verifyJwt, registerCompany);
router.route("/register-companyContact").post(verifyJwt, registerCompanyContact);
router.route("/register-bankDetails").post(verifyJwt, registerBankDetails);
router.route("/register-companyOverview").post(verifyJwt, registerCompanyOverview);
router.route("/register-companyOperations").post(verifyJwt, registerCompanyOperations);
router.route("/register-references").post(verifyJwt, registerCompanyOperations);
router.route("/company-data").get(verifyJwt, getCompanyData);

export default router;