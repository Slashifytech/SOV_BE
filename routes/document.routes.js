import { Router } from "express";
import { deleteDocument, getAllDocuments, getSingleDocument, uploadDocument } from "../controllers/document.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/upload").get(verifyJwt, uploadDocument);
router.route("/all").get(verifyJwt, getAllDocuments);
router.route("/:id").get(verifyJwt, getSingleDocument);
router.route("/:id").delete(verifyJwt, deleteDocument);

export default router;