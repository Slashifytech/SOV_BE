import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createTicket } from "../controllers/ticket.controller.js";
const router = Router();

router.route("/create-ticket").post( verifyJwt, createTicket);


export default router;