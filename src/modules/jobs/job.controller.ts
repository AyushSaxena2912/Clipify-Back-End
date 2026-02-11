import { Request, Response } from "express";
import { createJob, getJobById } from "./job.service";

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