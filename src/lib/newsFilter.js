import { generateText } from 'ai';
import { textModel as model } from '@/lib/aiProvider';


/**
 * Use LLM to classify, summarize, and extract key takeaways from a news article.
 * Returns { isApproved, topics, summary, keyTakeaways, rejectionReason }
 */
export async function filterArticle(article) {
  try {
    const { text } = await generateText({
      model,
      prompt: `You are a content curator for a LEARNING platform. Every item you approve must teach the reader something evergreen — a concept, method, tactic, framework, skill, or deeper understanding they can carry forward and apply. This is NOT a news site: current-events reporting does not belong here, even when it is "important." Analyze this article and return ONLY a valid JSON object (no markdown, no code blocks):

Article Title: "${article.title}"
Article Content: "${(article.content || '').slice(0, 2000)}"
Source: ${article.sourceName}

Return this exact JSON structure:
{
  "isEducational": true/false,
  "isHardNews": true/false,
  "isControversial": true/false,
  "topics": ["topic1", "topic2"],
  "summary": "A detailed 3-4 sentence summary that explains the core topic, what the reader will learn, and why it matters. Write it so a reader can understand the key lesson without visiting the source.",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
}

Rules:
- isEducational: true if a curious reader LEARNS something transferable — how something works, a method/tactic/technique, a framework, a skill, a new way to do or understand something, or a discovery clearly explained — in ANY field (science, space, technology, programming, health, medicine, fitness, psychology, philosophy & ideas, history, economics, personal finance, business, education, environment, culture, self-improvement). The subject is irrelevant; teaching value is everything.
- isHardNews: true if the piece mainly REPORTS a current event or announcement rather than teaching something evergreen — e.g. politics/elections/legislation as events, crime, violence, war/attacks, deaths/obituaries, natural disasters, scandals/lawsuits, funding/earnings/corporate announcements, product launches/releases, sports results, or celebrity news. If the reader would NOT walk away with a transferable concept, method, or deeper understanding, set this true.
- isControversial: true if designed to provoke outrage, is highly partisan, or is clickbait.
- topics: choose 1-3 that best fit from: "AI", "Programming", "Web Dev", "Design", "Startups", "Science", "Space", "Health & Fitness", "Medical", "Psychology", "Philosophy & Ideas", "History", "Economics", "Personal Finance", "Environment", "Education", "Culture", "Business", "Productivity", "Career". If none fit well, pick the closest.
- summary: Write a self-contained summary focused on what the reader learns. Neutral, factual, educational tone.
- keyTakeaways: 3-4 concise bullet points capturing the most valuable lessons, methods, or insights. Each should be a complete, standalone takeaway.`,
    });

    // Parse the JSON response, handling potential markdown wrapping
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    const isApproved =
      result.isEducational === true &&
      result.isHardNews !== true &&
      result.isControversial !== true;

    return {
      isApproved,
      topics: result.topics || [],
      summary: result.summary || '',
      keyTakeaways: result.keyTakeaways || [],
      rejectionReason: !isApproved ? `Educational: ${result.isEducational}, HardNews: ${result.isHardNews}, Controversial: ${result.isControversial}` : null,
    };
  } catch (err) {
    console.error('LLM filter error:', err.message);
    // On error, reject the article to be safe
    return {
      isApproved: false,
      topics: [],
      summary: '',
      keyTakeaways: [],
      rejectionReason: `Filter error: ${err.message}`,
    };
  }
}
