import { Router } from "express";
import { adminLogin, changeAdminEmail, changePassword } from "../controllers/admin.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/login").post(adminLogin );
router.route("/change-password").post(verifyAdmin, changePassword );
router.route("/change-email").post(verifyAdmin, changeAdminEmail );



export default router;