import { Router } from "express";
import { handleCreateJob, handleGetJob } from "./job.controller";

const router = Router();

router.post("/", handleCreateJob);
router.get("/:id", handleGetJob);

export default router;