import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { withdrawal } from "../controllers/withdrawal.controller.js";
const router = Router();

router.route("/withdrawal").post( verifyJwt, withdrawal);


export default router;