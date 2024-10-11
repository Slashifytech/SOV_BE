import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getTotalApplicationCount, getTotalCompletedCount, getTotalUnderReviewCount } from "../controllers/agentDashboard.controller.js";
import { getTotalStudentCount } from "../controllers/adminDashboard.controller.js";
const router = Router();

router.route("/total-application").get(verifyJwt, getTotalApplicationCount);
router.route("/total-student-count").get(verifyJwt, getTotalStudentCount);
router.route("/under-review-application").get(verifyJwt, getTotalUnderReviewCount);
router.route("/completed-application").get(verifyJwt, getTotalCompletedCount);
export default router;
