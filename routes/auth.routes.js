import { Router } from "express";
import {
  approveStudent,
  changePassword,
  login,
  logout,
  sendAgentOtp,
  sentStudentOtp,
  verifyAgentOtp,
  verifyStudentOtp,
} from "../controllers/auth.controller.js";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/verify-student").post(verifyStudentOtp);
router.route("/sent-studentOtp").post(sentStudentOtp);
router.route("/sent-agentOtp").post(sendAgentOtp);
router.route("/verify-agent").post(verifyAgentOtp);
router.route("/login").post(login);
router.route("/logout").post(verifyJwt, logout);
router.route("/change-password").patch(verifyJwt, changePassword);
router.route("/approve-student").patch(verifyAdmin, approveStudent);

export default router;
