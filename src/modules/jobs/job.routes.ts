import { Router } from "express";
import {
  handleCreateJob,
  handleGetJob,
  handleGetAllJobs,
  handleUpdateJobStatus
} from "./job.controller";

const router = Router();

router.post("/", handleCreateJob);
router.get("/", handleGetAllJobs);
router.get("/:id", handleGetJob);
router.patch("/:id/status", handleUpdateJobStatus);

export default router;