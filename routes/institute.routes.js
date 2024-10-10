import { Router } from "express";
import { getAllInstitute } from "../controllers/institute.controller.js";
const router = Router();

router.route("/all").get( getAllInstitute);

export default router;