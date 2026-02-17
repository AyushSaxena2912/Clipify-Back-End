import { Router } from "express";
import {
  handleCreateJob,
  handleGetJob,
  handleGetAllJobs
} from "./job.controller";

import { authenticate } from "../auth/auth.middleware";

const router = Router();

// Protect all routes
router.post("/", authenticate, handleCreateJob);
router.get("/", authenticate, handleGetAllJobs);
router.get("/:id", authenticate, handleGetJob);

export default router;