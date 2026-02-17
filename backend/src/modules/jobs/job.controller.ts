import { Response } from "express";
import { checkJobRateLimit } from "../../utils/jobRateLimiter";
import {
  createJob,
  getJobById,
  getAllJobs
} from "./job.service";
import { AuthRequest } from "../auth/auth.middleware";

/* --------------------------- */
/* CREATE JOB                  */
/* --------------------------- */
export const handleCreateJob = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { url, count } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid URL is required"
      });
    }

    // Rate limit check (10 per hour)
    const allowed = await checkJobRateLimit(userId);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: "Job limit exceeded. Max 10 jobs per hour."
      });
    }

    let clipCount = Number(count);
    if (!Number.isInteger(clipCount) || clipCount < 1 || clipCount > 10) {
      clipCount = 3;
    }

    const job = await createJob(userId, url, clipCount);

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job
    });

  } catch (error) {
    console.error("Create Job Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


/* --------------------------- */
/* GET SINGLE JOB              */
/* --------------------------- */
export const handleGetJob = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required"
      });
    }

    const job = await getJobById(id, userId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    return res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error("Get Job Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


/* --------------------------- */
/* GET ALL JOBS                */
/* --------------------------- */
export const handleGetAllJobs = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const jobs = await getAllJobs(userId);

    return res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });

  } catch (error) {
    console.error("Get All Jobs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};