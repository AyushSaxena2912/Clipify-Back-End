import { pool } from "../../db/pool";
import { v4 as uuidv4 } from "uuid";

export const createJob = async (url: string) => {
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO jobs (id, url, status)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, url, "queued"]
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