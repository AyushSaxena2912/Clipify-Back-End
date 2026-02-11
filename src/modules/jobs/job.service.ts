import { pool } from "../../db/pool";
import { v4 as uuidv4 } from "uuid";
import { redis } from "../../queue/redis";

export const createJob = async (url: string) => {
  const id = uuidv4();

  // Insert job as queued
  await pool.query(
    `INSERT INTO jobs (id, url, status)
     VALUES ($1, $2, $3)`,
    [id, url, "queued"]
  );

  // Push job ID to Redis queue
  await redis.lpush("jobQueue", id);

  const result = await pool.query(
    `SELECT * FROM jobs WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

export const getJobById = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM jobs WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

export const getAllJobs = async () => {
  const result = await pool.query(
    `SELECT * FROM jobs ORDER BY created_at DESC`
  );

  return result.rows;
};

export const updateJobStatus = async (id: string, status: string) => {
  const result = await pool.query(
    `UPDATE jobs
     SET status = $1,
         completed_at = CASE 
           WHEN $1 = 'completed' THEN NOW()
           ELSE completed_at
         END
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  return result.rows[0];
};