import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { redis } from "./redis";
import { pool } from "../db/pool";
import { detectHighlightsWithGemini } from "../ai/gemini";

const execAsync = promisify(exec);

type Highlight = {
  start: number;
  end: number;
  title?: string;
  hook?: string;
  viral_score?: number;
  reason?: string;
};

/* -------------------------------- */
/* LOG HELPER                       */
/* -------------------------------- */

const log = (jobId: string, message: string) => {
  console.log(`[JOB ${jobId}] ${message}`);
};

/* -------------------------------- */
/* ENSURE FOLDERS                   */
/* -------------------------------- */

const ensureFolders = () => {
  const folders = [
    "storage/videos",
    "storage/audio",
    "storage/transcripts",
    "storage/highlights",
    "storage/clips",
  ];

  folders.forEach((folder) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      console.log(`Created folder: ${folder}`);
    }
  });
};

/* -------------------------------- */
/* DOWNLOAD VIDEO                   */
/* -------------------------------- */

const downloadVideo = async (url: string, jobId: string) => {
  const outputPath = path.join("storage/videos", `${jobId}.mp4`);
  log(jobId, "Starting video download...");

  await execAsync(
    `yt-dlp -f mp4 -o "${outputPath}" "${url}"`,
    { maxBuffer: 1024 * 1024 * 50 }
  );

  log(jobId, "Video downloaded successfully.");
  return outputPath;
};

/* -------------------------------- */
/* EXTRACT AUDIO                    */
/* -------------------------------- */

const extractAudio = async (videoPath: string, jobId: string) => {
  const audioPath = path.join("storage/audio", `${jobId}.mp3`);
  log(jobId, "Extracting audio...");

  await execAsync(
    `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame "${audioPath}" -y`,
    { maxBuffer: 1024 * 1024 * 50 }
  );

  log(jobId, "Audio extracted.");
  return audioPath;
};

/* -------------------------------- */
/* TRANSCRIBE                       */
/* -------------------------------- */

const transcribeAudio = async (audioPath: string, jobId: string) => {
  const transcriptPath = path.join(
    "storage/transcripts",
    `${jobId}.json`
  );

  log(jobId, "Starting transcription...");

  await execAsync(
    `venv/bin/python scripts/transcribe.py "${audioPath}" "${transcriptPath}"`
  );

  log(jobId, "Transcription completed.");
  return transcriptPath;
};

/* -------------------------------- */
/* CUT CLIP                         */
/* -------------------------------- */

const cutClip = async (
  videoPath: string,
  start: number,
  end: number,
  outputPath: string,
  jobId: string,
  index: number
) => {
  const duration = end - start;

  log(jobId, `Cutting clip ${index} (${start}s → ${end}s)...`);

  await execAsync(
    `ffmpeg -ss ${start} -i "${videoPath}" -t ${duration} -c:v libx264 -c:a aac -movflags +faststart "${outputPath}" -y`
  );

  log(jobId, `Clip ${index} created.`);
};

/* -------------------------------- */
/* WORKER                           */
/* -------------------------------- */

const startWorker = async () => {
  console.log("Worker started and waiting for jobs...");
  ensureFolders();

  while (true) {
    let jobId: string | null = null;

    try {
      const job = await redis.brpop("jobQueue", 0);
      if (!job) continue;

      jobId = job[1];
      log(jobId, "Job received from queue.");

      const result = await pool.query(
        `SELECT * FROM jobs WHERE id = $1`,
        [jobId]
      );

      const jobData = result.rows[0];
      if (!jobData) {
        log(jobId, "Job not found in database.");
        continue;
      }

      await pool.query(
        `UPDATE jobs SET status = 'processing' WHERE id = $1`,
        [jobId]
      );

      log(jobId, "Status updated to processing.");

      /* -------- PIPELINE -------- */

      const videoPath = await downloadVideo(jobData.url, jobId);
      const audioPath = await extractAudio(videoPath, jobId);
      const transcriptPath = await transcribeAudio(audioPath, jobId);

      log(jobId, "Reading transcript file...");
      const transcriptRaw = fs.readFileSync(transcriptPath, "utf-8");
      const transcriptJson = JSON.parse(transcriptRaw);
      const transcriptText: string = transcriptJson.text;

      /* -------- CLIP COUNT -------- */

      const clipCount =
        typeof jobData.clip_count === "number" &&
        jobData.clip_count > 0
          ? jobData.clip_count
          : 3;

      log(jobId, `Requested clip count: ${clipCount}`);

      /* -------- GEMINI -------- */

      log(jobId, "Sending transcript to Gemini...");

      let highlights: Highlight[] = [];

      try {
        const parsed = await detectHighlightsWithGemini(
          transcriptText,
          clipCount
        );

        if (Array.isArray(parsed)) {
          highlights = parsed.filter(
            (clip: any) =>
              typeof clip.start === "number" &&
              typeof clip.end === "number" &&
              clip.end > clip.start
          );
        }
      } catch (e) {
        log(jobId, "Gemini error occurred.");
      }

      highlights = highlights.slice(0, clipCount);

      log(jobId, `Gemini returned ${highlights.length} clips.`);

      /* -------- SAVE HIGHLIGHTS -------- */

      const highlightsPath = path.join(
        "storage/highlights",
        `${jobId}.json`
      );

      fs.writeFileSync(
        highlightsPath,
        JSON.stringify(highlights, null, 2)
      );

      log(jobId, "Highlights saved to storage.");

      /* -------- CUT CLIPS -------- */

      const clipsDir = path.join("storage/clips", jobId);
      fs.mkdirSync(clipsDir, { recursive: true });

      const generatedClips: string[] = [];

      for (let i = 0; i < highlights.length; i++) {
        const clip = highlights[i];

        const outputClipPath = path.join(
          clipsDir,
          `clip_${i + 1}.mp4`
        );

        await cutClip(
          videoPath,
          clip.start,
          clip.end,
          outputClipPath,
          jobId,
          i + 1
        );

        generatedClips.push(outputClipPath);
      }

      /* -------- UPDATE DB -------- */

      await pool.query(
        `UPDATE jobs
         SET status = 'completed',
             transcript_path = $1,
             highlights_path = $2,
             clips_path = $3,
             completed_at = NOW()
         WHERE id = $4`,
        [
          transcriptPath,
          highlightsPath,
          JSON.stringify(generatedClips),
          jobId
        ]
      );

      log(jobId, "Database updated.");
      log(jobId, "Job completed successfully.");
      console.log("--------------------------------------------------");

    } catch (err) {
      console.error("Worker error:", err);

      if (jobId) {
        await pool.query(
          `UPDATE jobs SET status = 'failed' WHERE id = $1`,
          [jobId]
        );
        log(jobId, "Job marked as failed.");
      }
    }
  }
};

startWorker();