import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY not found in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

export const detectHighlightsWithGemini = async (
  transcriptText: string
) => {
  try {
    const prompt = `
You are a world-class viral content editor, retention analyst, 
and short-form algorithm expert (YouTube Shorts, Reels, TikTok).

Your job is to extract ONLY the most viral, high-retention, 
dopamine-spiking moments from this transcript.

STRICT OBJECTIVE:
Maximize watch time, emotional intensity, curiosity, and replay value.

SELECTION CRITERIA:
Select moments that include emotional spikes, bold claims, secrets,
money stories, transformation, controversy, humor, value bombs.

REJECT greetings, context setup, repetition, sponsor talk,
generic advice, neutral tone.

CLIP RULES:
• Each clip must feel COMPLETE.
• Minimum duration: 18 seconds
• Maximum duration: 65 seconds
• First 3 seconds must be powerful.
• Last line must feel impactful.

LANGUAGE:
Auto-detect English, Hindi, Hinglish.
Preserve original language.
Do NOT translate.

OUTPUT FORMAT:
Return STRICT JSON array:

[
  {
    "start": number,
    "end": number,
    "title": "Short viral hook title",
    "hook": "Powerful opening sentence",
    "viral_score": number,
    "reason": "Why this clip works"
  }
]

IMPORTANT:
Return ONLY JSON.
No markdown.
No explanation.

Transcript:
${transcriptText}
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // 🔥 Clean markdown if Gemini adds it
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // 🔥 Parse safely
    const parsed = JSON.parse(text);

    return parsed;

  } catch (error) {
    console.error("Gemini error:", error);

    // Fallback so worker doesn't crash
    return [];
  }
};