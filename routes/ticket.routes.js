import { Router } from "express";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware.js";
import { createTicket, getAllTickets, getMyTickets, getTicketById, updateTicketStatus } from "../controllers/ticket.controller.js";
const router = Router();

router.route("/create-ticket").post( verifyJwt, createTicket);
router.route("/all").get( verifyAdmin, getAllTickets);
router.route("/my-tickets").get( verifyJwt, getMyTickets);
router.route("/ticket/:ticketId").get( verifyJwt, getTicketById);
router.route("/ticket/:ticketId").patch( verifyAdmin, updateTicketStatus);


export default router;