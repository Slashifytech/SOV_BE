import { Router } from "express";
import { verifyAdmin } from "../middlewares/auth.middleware";
import { changeStudentInformationStatus, getTotalAgentsCount, getTotalStudentCount } from "../controllers/adminDashboard.controller";
const router = Router();

router.route("/agent-count").get(verifyAdmin, getTotalAgentsCount);
router.route("/student-count").get(verifyAdmin, getTotalStudentCount);
router.route("/change-student-information-status").get(verifyAdmin, changeStudentInformationStatus);
export default router;