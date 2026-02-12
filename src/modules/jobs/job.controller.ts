import { Request, Response } from "express";
import {
  createJob,
  getJobById,
  getAllJobs,
  updateJobStatus
} from "./job.service";

const allowedStatuses = ["queued", "processing", "completed", "failed"] as const;

/* CREATE JOB */
export const handleCreateJob = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid URL is required"
      });
    }

    const job = await createJob(url);

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

/* GET SINGLE JOB */
export const handleGetJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required"
      });
    }

    const job = await getJobById(id);

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

/* GET ALL JOBS */
export const handleGetAllJobs = async (_req: Request, res: Response) => {
  try {
    const jobs = await getAllJobs();

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

/* UPDATE STATUS */
export const handleUpdateJobStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required"
      });
    }

    if (!status || typeof status !== "string") {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    if (!allowedStatuses.includes(status as any)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const updatedJob = await updateJobStatus(id, status);

    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    return res.json({
      success: true,
      message: "Job status updated",
      data: updatedJob
    });

  } catch (error) {
    console.error("Update Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};