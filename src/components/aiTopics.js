/* ══════════════════════════════════════════════════════
   AI TOPIC GENERATION (Gemini)
══════════════════════════════════════════════════════ */
export async function generateTopicsWithAI({ text, count, level, style, language }) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error("Missing Gemini API key. Add VITE_GEMINI_API_KEY to your .env");
  }

  const systemPrompt = `You are an expert academic curriculum designer. 
Respond with ONLY valid JSON. No markdown, no explanation.`;

  const userPrompt = `Generate exactly ${count} assignment topics from the content below.

Academic level: ${level}
Style: ${style}
Language: ${language}

Requirements:
- Each topic must be a complete, meaningful assignment title
- Include description, difficulty, estimated hours, and tags

Content:
---
${text.slice(0, 3500)}
---

Respond ONLY with this JSON:
{
  "topics": [
    {
      "title": "Full assignment title",
      "description": "2-sentence description of what student will do",
      "difficulty": "Easy|Medium|Hard",
      "estimatedHours": 5,
      "tags": ["tag1", "tag2"]
    }
  ],
  "contentSummary": "One sentence summary of the source material"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]);
}
