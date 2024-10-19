import { Router } from "express";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { changeApplicationStatus, changeStudentInformationStatus, getAllApplications, getTotalAgentsCount, getTotalStudentCount } from "../controllers/adminDashboard.controller.js";
const router = Router();

router.route("/agent-count").get(verifyAdmin, getTotalAgentsCount);
router.route("/student-count").get(verifyAdmin, getTotalStudentCount);
router.route("/change-student-information-status").patch(verifyAdmin, changeStudentInformationStatus);
router.route("/all/applications").get(verifyAdmin, getAllApplications)
router.route("/change-application-status").patch(verifyAdmin, changeApplicationStatus)
export default router;