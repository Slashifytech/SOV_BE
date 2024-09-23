import { Router } from "express";
import {
  getAllStudents,
  getStudentDetails,
  getStudentPersonalInformation,
  studentPersonalInformation,
  studentPreference,
  studentResidenceAndAddress,
} from "../controllers/studentInformation.controller.js";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/personal-information")
  .post(
    verifyJwt, // Make sure the field name matches your form's file input name
    studentPersonalInformation
  );
router.route("/residance-address").post(verifyJwt, studentResidenceAndAddress);
router.route("/prefrence").post(verifyJwt, studentPreference);
router
  .route("/personal-information/:studentId")
  .get(verifyJwt, getStudentPersonalInformation);
router.route("/details").get(verifyJwt, getStudentDetails);
router.route("/all-students").get(verifyAdmin, getAllStudents);
export default router;
