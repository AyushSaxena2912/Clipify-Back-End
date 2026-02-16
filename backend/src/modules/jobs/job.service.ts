import { pool } from "../../db/pool";
import { v4 as uuidv4 } from "uuid";
import { redis } from "../../queue/redis";

/* --------------------------- */
/* CREATE JOB                  */
/* --------------------------- */
export const createJob = async (
  userId: string,
  url: string,
  clipCount: number
) => {
  const id = uuidv4();

  await pool.query(
    `
    INSERT INTO jobs (id, user_id, url, status, clip_count)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [id, userId, url, "queued", clipCount]
  );

  await redis.lpush("jobQueue", id);

  const result = await pool.query(
    `SELECT * FROM jobs WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  return result.rows[0] ?? null;
};


/* --------------------------- */
/* GET SINGLE JOB              */
/* --------------------------- */
export const getJobById = async (
  id: string,
  userId: string
) => {
  const result = await pool.query(
    `
    SELECT * FROM jobs
    WHERE id = $1 AND user_id = $2
    `,
    [id, userId]
  );

  return result.rows[0] ?? null;
};


/* --------------------------- */
/* GET ALL JOBS                */
/* --------------------------- */
export const getAllJobs = async (
  userId: string
) => {
  const result = await pool.query(
    `
    SELECT * FROM jobs
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
};


/* --------------------------- */
/* UPDATE STATUS               */
/* --------------------------- */
export const updateJobStatus = async (
  id: string,
  userId: string,
  status: string,
  transcriptPath?: string,
  highlightsPath?: string,
  clipsPath?: string[]
) => {
  const result = await pool.query(
    `
    UPDATE jobs
    SET
      status = $1,
      transcript_path = COALESCE($2, transcript_path),
      highlights_path = COALESCE($3, highlights_path),
      clips_path = COALESCE($4, clips_path),
      completed_at = CASE
        WHEN $1 = 'completed' THEN NOW()
        ELSE completed_at
      END
    WHERE id = $5
    AND user_id = $6
    RETURNING *
    `,
    [
      status,
      transcriptPath ?? null,
      highlightsPath ?? null,
      clipsPath ? JSON.stringify(clipsPath) : null,
      id,
      userId
    ]
  );

  return result.rows[0] ?? null;
};