import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { applicationOverview, editCertificate, editEducationDetails, editIELTSScore, editOfferLetterAnsPassport, editParentDocument, editPersonalInformation, editPreferences, editPTEScore, editStudentDocument, editTOEFLScore, getAllApplications, getApplicationById, getStudentAllApplications, registerCourseFeeApplication, registerGIC, registerOfferLetter } from "../controllers/institution.controller.js";
const router = Router();

router.route("/register-offerletter").post( verifyJwt, registerOfferLetter);
router.route("/register-gic").post( verifyJwt, registerGIC);
router.route("/all").get( verifyJwt, getAllApplications);
router.route("/course-fee-application").post( verifyJwt, registerCourseFeeApplication);
router.route("/application-overview").get( verifyJwt, applicationOverview);
router.route("/personal-information/:applicationId").patch( verifyJwt, editPersonalInformation);
router.route("/education-details/:applicationId").patch( verifyJwt, editEducationDetails);
router.route("/preference/:applicationId").patch( verifyJwt, editPreferences);
router.route("/ielts-score/:applicationId").patch( verifyJwt, editIELTSScore);
router.route("/ptl-score/:applicationId").patch( verifyJwt, editPTEScore);
router.route("/toefl-score/:applicationId").patch( verifyJwt, editTOEFLScore);
router.route("/certificate/:applicationId").patch( verifyJwt, editCertificate);
router.route("/student-document/:applicationId").patch( verifyJwt, editStudentDocument);
router.route("/parent-document/:applicationId").patch( verifyJwt, editParentDocument);
router.route("/offer-letter-and-passport/:applicationId").patch( verifyJwt, editOfferLetterAnsPassport);
router.route("/application/:id").get( verifyJwt, getApplicationById);
router.route("/application-application/:studentInformationId").get( verifyJwt, getStudentAllApplications);





export default router;