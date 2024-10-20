import { Router } from "express";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { changeApplicationStatus, changeStudentInformationStatus, getAllAgentData, getAllApplications, getTotalAgentsCount, getTotalStudentCount } from "../controllers/adminDashboard.controller.js";
import { getAllAgentStudent } from "../controllers/studentInformation.controller.js";
const router = Router();

router.route("/agent-count").get(verifyAdmin, getTotalAgentsCount);
router.route("/student-count").get(verifyAdmin, getTotalStudentCount);
router.route("/change-student-information-status").patch(verifyAdmin, changeStudentInformationStatus);
router.route("/all/applications").get(verifyAdmin, getAllApplications)
router.route("/change-application-status").patch(verifyAdmin, changeApplicationStatus)
router.route("/all/agent").patch(verifyAdmin, getAllAgentData)
router.route("/all/student").patch(verifyAdmin, getAllAgentStudent)


export default router;