import { Router } from "express";
import {
  getAllAgentStudent,
  getAllStudents,
  getStudentDetails,
  getStudentFormById,
  getStudentPersonalInformation,
  studentPersonalInformation,
  studentPreference,
  studentResidenceAndAddress,
  updateStudentPersonalInformation,
} from "../controllers/studentInformation.controller.js";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/personal-information")
  .post(
    verifyJwt, // Make sure the field name matches your form's file input name
    studentPersonalInformation
  );
router.route("/residence-address/:formId").patch(verifyJwt, studentResidenceAndAddress);
router.route("/preference/:formId").patch(verifyJwt, studentPreference);
router
  .route("/personal-information/:studentId")
  .get(verifyJwt, getStudentPersonalInformation);
router.route("/details").get(verifyJwt, getStudentDetails);
router.route("/all-students").get(verifyAdmin, getAllStudents);
router.route("/personal-information/:formId")
  .patch(
    verifyJwt,
    updateStudentPersonalInformation
  );
  router.route("/agent-student").get(verifyJwt, getAllAgentStudent);
  router.route("/student-information/:formId").get(verifyJwt, getStudentFormById);
export default router;
