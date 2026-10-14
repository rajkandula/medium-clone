import { generateText } from 'ai';
import { textModel as model } from '@/lib/aiProvider';


/**
 * Use LLM to summarize and extract key takeaways from a research paper.
 * Returns { summary, keyTakeaways }
 */
export async function filterResearchPaper(paper) {
  try {
    const { text } = await generateText({
      model,
      prompt: `You are an expert academic research assistant. Summarize and extract key takeaways from this research paper. Return ONLY a valid JSON object (no markdown formatting, no code blocks):

Paper Title: "${paper.title}"
Abstract: "${paper.abstract}"

Return this exact JSON structure:
{
  "summary": "A self-contained, crystal-clear 2-3 sentence overview explaining what this research paper achieved, the key methodology used, and why it is a major breakthrough.",
  "keyTakeaways": [
    "Takeaway 1: core finding or innovative contribution",
    "Takeaway 2: key metric, evaluation result, or proof",
    "Takeaway 3: real-world implication or future impact"
  ]
}

Rules:
- Write in an intellectual, inspiring, and clear tone (no academic jargon where simpler terms work, but keep it highly professional).
- Do not use first-person (we, I).
- keyTakeaways: Return exactly 3 stand-alone bullet points.`,
    });

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    return {
      summary: result.summary || '',
      keyTakeaways: result.keyTakeaways || [],
    };
  } catch (err) {
    console.error('LLM research filter error:', err.message);
    return {
      summary: '',
      keyTakeaways: [],
    };
  }
}
