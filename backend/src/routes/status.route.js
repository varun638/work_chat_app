import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createStatus, getStatuses } from "../controllers/status.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createStatus);
router.get("/", protectRoute, getStatuses);


export default router;