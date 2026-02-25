import { Router } from "express";
import {
  handleCreateJob,
  handleGetJob,
  handleGetAllJobs,
  handleJobStream
} from "./job.controller";

import { authenticate } from "../auth/auth.middleware";

const router = Router();

/* ----------------------------- */
/*   CREATE + LIST JOBS          */
/* ----------------------------- */

router.post("/", authenticate, handleCreateJob);
router.get("/", authenticate, handleGetAllJobs);

/* ----------------------------- */
/*   🔥 SSE STREAM (IMPORTANT)   */
/*   Must come BEFORE /:id       */
/* ----------------------------- */

router.get("/:id/stream", authenticate, handleJobStream);

/* ----------------------------- */
/*   GET SINGLE JOB              */
/* ----------------------------- */

router.get("/:id", authenticate, handleGetJob);

export default router;