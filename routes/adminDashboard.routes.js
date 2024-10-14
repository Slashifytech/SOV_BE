import { Router } from "express";
import { verifyAdmin } from "../middlewares/auth.middleware";
import { changeStudentInformationStatus, getAllApplications, getTotalAgentsCount, getTotalStudentCount } from "../controllers/adminDashboard.controller";
const router = Router();

router.route("/agent-count").get(verifyAdmin, getTotalAgentsCount);
router.route("/student-count").get(verifyAdmin, getTotalStudentCount);
router.route("/change-student-information-status").get(verifyAdmin, changeStudentInformationStatus);
router.route("/all/applications").get(verifyAdmin, getAllApplications)
export default router;