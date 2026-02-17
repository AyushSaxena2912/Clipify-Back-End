import fs from "fs";
import path from "path";
import { pool } from "../db/pool";

const STORAGE_ROOT = path.resolve(process.cwd(), "storage");

// ✅ 15 minutes test mode
// const EXPIRY_TIME =  * 60 * 1000;
const EXPIRY_TIME = 24 * 60 * 60 * 1000;

/* ---------------------------- */
/* SAFE DELETE HELPER           */
/* ---------------------------- */

const deleteIfExists = (absolutePath: string) => {
  try {
    if (fs.existsSync(absolutePath)) {
      const stat = fs.lstatSync(absolutePath);

      if (stat.isDirectory()) {
        fs.rmSync(absolutePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(absolutePath);
      }

      console.log("Deleted:", absolutePath);
    }
  } catch (err) {
    console.error("Delete error:", err);
  }
};

/* ---------------------------- */
/* CLEANUP LOGIC                */
/* ---------------------------- */

const runCleanup = async () => {
  console.log("Running cleanup check...");

  const result = await pool.query(`
    SELECT id, completed_at
    FROM jobs
    WHERE status = 'completed'
      AND completed_at IS NOT NULL
      AND (
        transcript_path IS NOT NULL
        OR highlights_path IS NOT NULL
        OR clips_path IS NOT NULL
      )
  `);

  const jobs = result.rows;
  const now = Date.now();

  for (const job of jobs) {
    const completedAt = new Date(job.completed_at).getTime();

    if (now - completedAt > EXPIRY_TIME) {
      console.log("Cleaning job:", job.id);

      /* ---- DELETE STORAGE FILES ---- */

      deleteIfExists(path.join(STORAGE_ROOT, "clips", job.id));
      deleteIfExists(path.join(STORAGE_ROOT, "videos", `${job.id}.mp4`));
      deleteIfExists(path.join(STORAGE_ROOT, "audio", `${job.id}.mp3`));
      deleteIfExists(path.join(STORAGE_ROOT, "transcripts", `${job.id}.json`));
      deleteIfExists(path.join(STORAGE_ROOT, "highlights", `${job.id}.json`));

      /* ---- KEEP METADATA, CLEAR ONLY FILE PATHS ---- */

      await pool.query(
        `
        UPDATE jobs
        SET
          transcript_path = NULL,
          highlights_path = NULL,
          clips_path = NULL
        WHERE id = $1
        `,
        [job.id]
      );

      console.log("Cleanup done for job:", job.id);
    }
  }
};

/* ---------------------------- */
/* START WORKER                 */
/* ---------------------------- */

export const startCleanupWorker = () => {
  console.log("Cleanup worker started (15 min test mode)");

  // ✅ Check every 1 minute
  setInterval(runCleanup, 60 * 1000);
  // setInterval(runCleanup, 60 * 60 * 1000); // every 1 hour

  // Run immediately on startup
  runCleanup();
};