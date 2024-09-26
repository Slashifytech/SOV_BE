import { Router } from "express";
import { verifyAdmin } from "../middlewares/auth.middleware";
import { getTotalAgentsCount, getTotalStudentCount } from "../controllers/adminDashboard.controller";
const router = Router();

router.route("/agent-count").get(verifyAdmin, getTotalAgentsCount);
router.route("/student-count").get(verifyAdmin, getTotalStudentCount);

export default router;