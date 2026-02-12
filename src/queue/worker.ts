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

/* -------------------------------------------------- */
/* 🧱 ENSURE FOLDERS                                  */
/* -------------------------------------------------- */

const ensureFolders = () => {
  console.log("📁 Checking storage folders...");

  const folders = [
    "storage/videos",
    "storage/audio",
    "storage/transcripts",
    "storage/highlights",
    "storage/clips"
  ];

  folders.forEach((folder) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      console.log(`   ➕ Created: ${folder}`);
    }
  });

  console.log("✅ Folder check complete\n");
};

/* -------------------------------------------------- */
/* ⬇ DOWNLOAD VIDEO                                   */
/* -------------------------------------------------- */

const downloadVideo = async (url: string, jobId: string) => {
  const outputPath = path.join("storage/videos", `${jobId}.mp4`);

  console.log(`⬇ [${jobId}] Downloading video...`);

  await execAsync(
    `yt-dlp -f mp4 -o "${outputPath}" "${url}"`,
    { maxBuffer: 1024 * 1024 * 50 }
  );

  console.log(`✅ [${jobId}] Video downloaded`);
  return outputPath;
};

/* -------------------------------------------------- */
/* 🎵 EXTRACT AUDIO                                   */
/* -------------------------------------------------- */

const extractAudio = async (videoPath: string, jobId: string) => {
  const audioPath = path.join("storage/audio", `${jobId}.mp3`);

  console.log(`🎵 [${jobId}] Extracting audio...`);

  await execAsync(
    `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame "${audioPath}" -y`,
    { maxBuffer: 1024 * 1024 * 50 }
  );

  console.log(`✅ [${jobId}] Audio extracted`);
  return audioPath;
};

/* -------------------------------------------------- */
/* 🧠 TRANSCRIBE                                      */
/* -------------------------------------------------- */

const transcribeAudio = async (audioPath: string, jobId: string) => {
  const transcriptPath = path.join(
    "storage/transcripts",
    `${jobId}.json`
  );

  console.log(`🧠 [${jobId}] Transcribing audio...`);

  await execAsync(
    `venv/bin/python scripts/transcribe.py "${audioPath}" "${transcriptPath}"`
  );

  console.log(`✅ [${jobId}] Transcript generated`);
  return transcriptPath;
};

/* -------------------------------------------------- */
/* ✂ CUT CLIP (WITH AUDIO SAFE)                      */
/* -------------------------------------------------- */

const cutClip = async (
  videoPath: string,
  start: number,
  end: number,
  outputPath: string,
  jobId: string,
  index: number
) => {
  const duration = end - start;

  console.log(
    `✂ [${jobId}] Cutting clip ${index} (${start.toFixed(
      2
    )} → ${end.toFixed(2)})`
  );

  await execAsync(
    `ffmpeg -ss ${start} -i "${videoPath}" -t ${duration} -c:v libx264 -c:a aac -movflags +faststart "${outputPath}" -y`
  );

  console.log(`   ✅ Clip ${index} created`);
};

/* -------------------------------------------------- */
/* 🚀 WORKER                                          */
/* -------------------------------------------------- */

const startWorker = async () => {
  console.log("🚀 Worker started...\n");
  ensureFolders();

  while (true) {
    let jobId: string | null = null;

    try {
      console.log("📦 Waiting for job in Redis...\n");

      const job = await redis.brpop("jobQueue", 0);
      if (!job) continue;

      jobId = job[1];
      console.log(`🎯 Processing job: ${jobId}\n`);

      const result = await pool.query(
        `SELECT * FROM jobs WHERE id = $1`,
        [jobId]
      );

      const jobData = result.rows[0];
      if (!jobData) {
        console.log("❌ Job not found in DB\n");
        continue;
      }

      await pool.query(
        `UPDATE jobs SET status = 'processing' WHERE id = $1`,
        [jobId]
      );

      /* ===== PIPELINE ===== */

      const videoPath = await downloadVideo(jobData.url, jobId);
      const audioPath = await extractAudio(videoPath, jobId);
      const transcriptPath = await transcribeAudio(audioPath, jobId);

      /* Read transcript */
      console.log(`📖 [${jobId}] Reading transcript...`);
      const transcriptRaw = fs.readFileSync(transcriptPath, "utf-8");
      const transcriptJson = JSON.parse(transcriptRaw);
      const transcriptText: string = transcriptJson.text;

      /* Gemini */
      console.log(`🤖 [${jobId}] Generating highlights...`);

      let highlights: Highlight[] = [];

      try {
        const raw = await detectHighlightsWithGemini(transcriptText);
        const parsed =
          typeof raw === "string" ? JSON.parse(raw) : raw;

        if (Array.isArray(parsed)) {
          highlights = parsed.filter(
            (clip: any) =>
              typeof clip.start === "number" &&
              typeof clip.end === "number" &&
              clip.end > clip.start
          );
        }

        console.log(
          `🎯 [${jobId}] ${highlights.length} valid highlights found`
        );

      } catch (e) {
        console.error("❌ Gemini parsing error:", e);
      }

      /* Save highlights */
      const highlightsPath = path.join(
        "storage/highlights",
        `${jobId}.json`
      );

      fs.writeFileSync(
        highlightsPath,
        JSON.stringify(highlights, null, 2)
      );

      console.log(`💾 [${jobId}] Highlights saved\n`);

      /* CUT CLIPS */
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

      /* Update DB */
      console.log(`💾 [${jobId}] Updating database...`);

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

      console.log(`🎉 [${jobId}] JOB COMPLETED\n`);
      console.log("========================================\n");

    } catch (err) {
      console.error("🔥 Worker error:", err);

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