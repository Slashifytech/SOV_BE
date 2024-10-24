import { Router } from "express";
import {
  adminLogin,
  changeAdminEmail,
  changePassword,
  editProfile,
  getProfileData,
} from "../controllers/admin.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/login").post(adminLogin);
router.route("/change-password").post(verifyAdmin, changePassword);
router.route("/change-email").post(verifyAdmin, changeAdminEmail);
router.route("/edit-profile").patch(verifyAdmin, editProfile);
router.route("/profile").get(verifyAdmin, getProfileData);

export default router;
