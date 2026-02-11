import { redis } from "./redis";
import { pool } from "../db/pool";

const fakeTask = async (name: string) => {
  console.log(name);
  await new Promise((resolve) => setTimeout(resolve, 2000));
};

const startWorker = async () => {
  console.log("Worker started...");

  while (true) {
    try {
      const job = await redis.brpop("jobQueue", 0);

      if (!job) continue;

      const jobId = job[1];
      console.log("Processing job:", jobId);

      await pool.query(
        `UPDATE jobs SET status = 'processing' WHERE id = $1`,
        [jobId]
      );

      await fakeTask("Downloading video...");
      await fakeTask("Extracting audio...");
      await fakeTask("Transcribing...");
      await fakeTask("Generating clips...");

      await pool.query(
        `UPDATE jobs
         SET status = 'completed',
             completed_at = NOW()
         WHERE id = $1`,
        [jobId]
      );

      console.log("Completed job:", jobId);

    } catch (err) {
      console.error("Worker error:", err);
    }
  }
};

// IMPORTANT
startWorker();