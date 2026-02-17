import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { redis } from "./redis";
import { pool } from "../db/pool";
import { detectHighlightsWithGemini } from "../ai/gemini";

const execAsync = promisify(exec);

const role = process.argv[2];

if (!["download", "transcribe", "render"].includes(role)) {
  console.error("Provide worker role: download | transcribe | render");
  process.exit(1);
}

type Highlight = {
  start: number;
  end: number;
};

const log = (jobId: string, message: string) => {
  console.log(`[${role.toUpperCase()}][JOB ${jobId}] ${message}`);
};

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
    }
  });
};

/* ------------------ HELPERS ------------------ */

const downloadVideo = async (url: string, jobId: string) => {
  const outputPath = path.join("storage/videos", `${jobId}.mp4`);
  await execAsync(
    `yt-dlp -f mp4 -o "${outputPath}" "${url}"`,
    { maxBuffer: 1024 * 1024 * 50 }
  );
  return outputPath;
};

const extractAudio = async (videoPath: string, jobId: string) => {
  const audioPath = path.join("storage/audio", `${jobId}.mp3`);
  await execAsync(
    `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame "${audioPath}" -y`,
    { maxBuffer: 1024 * 1024 * 50 }
  );
  return audioPath;
};

const transcribeAudio = async (audioPath: string, jobId: string) => {
  const transcriptPath = path.join(
    "storage/transcripts",
    `${jobId}.json`
  );

  await execAsync(
    `venv/bin/python scripts/transcribe.py "${audioPath}" "${transcriptPath}"`,
    { maxBuffer: 1024 * 1024 * 50 }
  );

  return transcriptPath;
};

const cutClip = async (
  videoPath: string,
  start: number,
  end: number,
  outputPath: string
) => {
  const duration = end - start;

  await execAsync(
    `ffmpeg -ss ${start} -i "${videoPath}" -t ${duration} -c:v libx264 -c:a aac -movflags +faststart "${outputPath}" -y`,
    { maxBuffer: 1024 * 1024 * 50 }
  );
};

/* ------------------ WORKER LOOP ------------------ */

const startWorker = async () => {
  console.log(`Worker started for role: ${role}`);
  ensureFolders();

  const queueName = `queue:${role}`;

  while (true) {
    let jobId: string | null = null;

    try {
      const job = await redis.brpop(queueName, 0);
      if (!job) continue;

      jobId = job[1];
      log(jobId, "Job received.");

      const result = await pool.query(
        `SELECT * FROM jobs WHERE id = $1`,
        [jobId]
      );

      const jobData = result.rows[0];
      if (!jobData) continue;

      /* ------------ DOWNLOAD ROLE ------------ */
      if (role === "download") {
        await pool.query(
          `UPDATE jobs SET status = 'downloading' WHERE id = $1`,
          [jobId]
        );

        const videoPath = await downloadVideo(jobData.url, jobId);
        const audioPath = await extractAudio(videoPath, jobId);

        await pool.query(
          `UPDATE jobs SET video_path = $1, audio_path = $2 WHERE id = $3`,
          [videoPath, audioPath, jobId]
        );

        await redis.lpush("queue:transcribe", jobId);
        log(jobId, "Moved to transcribe queue.");
      }

      /* ------------ TRANSCRIBE ROLE ------------ */
      if (role === "transcribe") {
        await pool.query(
          `UPDATE jobs SET status = 'transcribing' WHERE id = $1`,
          [jobId]
        );

        const audioPath = jobData.audio_path; // DB se lo

        const transcriptPath = await transcribeAudio(
          audioPath,
          jobId
        );

        await pool.query(
          `UPDATE jobs SET transcript_path = $1 WHERE id = $2`,
          [transcriptPath, jobId]
        );

        await redis.lpush("queue:render", jobId);
        log(jobId, "Moved to render queue.");
      }

      /* ------------ RENDER ROLE ------------ */
      if (role === "render") {
        await pool.query(
          `UPDATE jobs SET status = 'rendering' WHERE id = $1`,
          [jobId]
        );

        const transcriptPath = jobData.transcript_path;

        const transcriptRaw = fs.readFileSync(
          transcriptPath,
          "utf-8"
        );

        const transcriptJson = JSON.parse(transcriptRaw);
        const transcriptText: string = transcriptJson.text;

        const clipCount =
          typeof jobData.clip_count === "number" &&
          jobData.clip_count > 0
            ? jobData.clip_count
            : 3;

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
          log(jobId, "Gemini error.");
        }

        highlights = highlights.slice(0, clipCount);

        const highlightsPath = path.join(
          "storage/highlights",
          `${jobId}.json`
        );

        fs.writeFileSync(
          highlightsPath,
          JSON.stringify(highlights, null, 2)
        );

        const videoPath = jobData.video_path;

        const clipsDir = path.join(
          "storage/clips",
          jobId
        );

        fs.mkdirSync(clipsDir, { recursive: true });

        const generatedClips: string[] = [];

        for (let i = 0; i < highlights.length; i++) {
          const outputClipPath = path.join(
            clipsDir,
            `clip_${i + 1}.mp4`
          );

          await cutClip(
            videoPath,
            highlights[i].start,
            highlights[i].end,
            outputClipPath
          );

          generatedClips.push(outputClipPath);
        }

        await pool.query(
          `UPDATE jobs
           SET status = 'completed',
               highlights_path = $1,
               clips_path = $2,
               completed_at = NOW()
           WHERE id = $3`,
          [
            highlightsPath,
            JSON.stringify(generatedClips),
            jobId,
          ]
        );

        log(jobId, "Job completed.");
      }

    } catch (err) {
      console.error(`[${role}] Worker error for job ${jobId}`, err);

      if (jobId) {
        await pool.query(
          `UPDATE jobs SET status = 'failed' WHERE id = $1`,
          [jobId]
        );
      }
    }
  }
};

startWorker();