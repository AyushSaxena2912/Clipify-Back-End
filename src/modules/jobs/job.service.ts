import { pool } from "../../db/pool";
import { v4 as uuidv4 } from "uuid";
import { redis } from "../../queue/redis";

/* CREATE JOB */
export const createJob = async (url: string) => {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL");
  }

  const id = uuidv4();

  await pool.query(
    `INSERT INTO jobs (id, url, status)
     VALUES ($1, $2, $3)`,
    [id, url, "queued"]
  );

  // Push job ID to Redis queue (fire and forget safe)
  await redis.lpush("jobQueue", id);

  const result = await pool.query(
    `SELECT * FROM jobs WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

/* GET SINGLE JOB */
export const getJobById = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM jobs WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

/* GET ALL JOBS */
export const getAllJobs = async () => {
  const result = await pool.query(
    `SELECT * FROM jobs
     ORDER BY created_at DESC`
  );

  return result.rows;
};

/* UPDATE STATUS */
export const updateJobStatus = async (
  id: string,
  status: string,
  transcriptPath?: string
) => {
  const result = await pool.query(
    `UPDATE jobs
     SET status = $1,
         transcript_path = COALESCE($2, transcript_path),
         completed_at = CASE 
            WHEN $1 = 'completed' THEN NOW()
            ELSE completed_at
         END
     WHERE id = $3
     RETURNING *`,
    [status, transcriptPath ?? null, id]
  );

  return result.rows[0];
};