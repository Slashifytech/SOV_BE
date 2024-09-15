import { Router } from "express";
import {
  approveStudent,
  changePassword,
  login,
  logout,
  registerAgent,
  registerStudent,
} from "../controllers/auth.controller.js";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register-student").post(registerStudent);
router.route("/register/agent").post(registerAgent);
router.route("/login").post(login);
router.route("/logout").post(verifyJwt, logout);
router.route("/change-password").patch(verifyJwt, changePassword);
router.route("/approve-student").patch(verifyAdmin, approveStudent);

export default router;
