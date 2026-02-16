import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY not found in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

export const detectHighlightsWithGemini = async (
  transcriptText: string,
  clipCount: number = 3
) => {
  try {
    // Safety trim (avoid huge token overflow)
    const safeTranscript =
      transcriptText.length > 25000
        ? transcriptText.slice(0, 25000)
        : transcriptText;

    const prompt = `
You are a world-class viral content editor, retention analyst,
and short-form algorithm expert (YouTube Shorts, Reels, TikTok).

STRICT OBJECTIVE:
Extract EXACTLY ${clipCount} high-retention viral clips.

SELECTION CRITERIA:
Select emotional spikes, bold claims, secrets,
money stories, transformation, controversy, humor, value bombs.

REJECT greetings, context setup, repetition, sponsor talk,
generic advice, neutral tone.

CLIP RULES:
• Each clip must feel COMPLETE
• Minimum duration: 18 seconds
• Maximum duration: 65 seconds
• First 3 seconds must hook strongly
• Ending must feel impactful

LANGUAGE:
Auto-detect English, Hindi, Hinglish.
Preserve original language.
Do NOT translate.

OUTPUT FORMAT (STRICT JSON ARRAY ONLY):

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
Return EXACTLY ${clipCount} clips.
Return ONLY JSON.
No markdown.
No explanation.

Transcript:
${safeTranscript}
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // Clean markdown wrapping if Gemini adds it
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(text);

    // Final safety guard
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.slice(0, clipCount);

  } catch (error) {
    console.error("Gemini error:", error);
    return [];
  }
};