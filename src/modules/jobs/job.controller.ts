import { Request, Response } from "express";
import {
  createJob,
  getJobById,
  getAllJobs,
  updateJobStatus
} from "./job.service";

export const handleCreateJob = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    const job = await createJob(url);
    return res.status(201).json(job);

  } catch (error) {
    return res.status(500).json({ message: "Error creating job" });
  }
};

export const handleGetJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await getJobById(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json(job);

  } catch (error) {
    return res.status(500).json({ message: "Error fetching job" });
  }
};

export const handleGetAllJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await getAllJobs();
    return res.json(jobs);

  } catch (error) {
    return res.status(500).json({ message: "Error fetching jobs" });
  }
};

export const handleUpdateJobStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["queued", "processing", "completed", "failed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedJob = await updateJobStatus(id, status);

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json(updatedJob);

  } catch (error) {
    return res.status(500).json({ message: "Error updating job" });
  }
};