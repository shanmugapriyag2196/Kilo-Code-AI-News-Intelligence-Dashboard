type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } | null } | null>;
}

export class AIService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(config: { baseUrl: string; apiKey: string; model: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async generateSummary(content: string, title: string): Promise<string | null> {
    if (!content || content.length < 100) return null;

    try {
      const text = await this.chat(
        [
          {
            role: 'system',
            content: 'Summarize the following AI-related article in 1-2 concise sentences. Focus on the key news or development. Be factual and specific.',
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nContent: ${content.slice(0, 6000)}`,
          },
        ],
        { maxTokens: 200, temperature: 0.3 }
      );
      return text?.trim() || null;
    } catch {
      return null;
    }
  }

  async classifyArticle(title: string, content: string): Promise<{ category: string; subcategory: string | null }> {
    const fallback = deterministicCategory(title, content);

    if (!content) return fallback;

    try {
      const text = await this.chat(
        [
          {
            role: 'system',
            content: `Classify this AI article into one of these categories: ${AI_CATEGORIES.join(', ')}. Respond with JSON: {"category": "...", "subcategory": "..."}`,
          },
          {
            role: 'user',
            content: `Title: ${title}\n\n${content.slice(0, 3000)}`,
          },
        ],
        { maxTokens: 60, temperature: 0.1 }
      );

      const match = (text || '').match(/\{.*\}/s);
      if (match) {
        const parsed = JSON.parse(match[0]) as { category?: string; subcategory?: string | null };
        const category = parsed.category;
        if (category && AI_CATEGORIES.includes(category as (typeof AI_CATEGORIES)[number])) {
          return { category, subcategory: parsed.subcategory || null };
        }
      }
      return fallback;
    } catch {
      return fallback;
    }
  }

  async computeSimilarity(text1: string, text2: string): Promise<number> {
    return deterministicSimilarity(text1, text2);
  }

  async computeTrendingScore(article: { title: string; content: string; sourceDomain: string; publishedAt: string }): Promise<number> {
    let score = 0;
    const titleLower = article.title.toLowerCase();
    const contentLower = (article.content || '').toLowerCase();

    if (titleLower.includes('launch') || titleLower.includes('released') || titleLower.includes('announces')) score += 20;
    if (titleLower.includes('openai') || titleLower.includes('google') || titleLower.includes('anthropic') || titleLower.includes('meta')) score += 15;
    if (titleLower.includes('billion') || titleLower.includes('million') || titleLower.includes('funding') || titleLower.includes('acquisition')) score += 25;
    if (titleLower.includes('breakthrough') || titleLower.includes('first') || titleLower.includes('new model')) score += 20;

    const wordCount = (article.content || '').split(/\s+/).length;
    if (wordCount > 500) score += 10;

    const recencyHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (recencyHours < 6) score += 30;
    else if (recencyHours < 24) score += 20;
    else if (recencyHours < 72) score += 10;

    const aiTermCount = ['ai', 'artificial intelligence', 'machine learning', 'neural', 'transformer', 'gpt', 'llm', 'model']
      .filter(t => contentLower.includes(t)).length;
    score += Math.min(aiTermCount * 5, 20);

    return Math.min(score, 100);
  }

  private async chat(messages: ChatMessage[], options: { maxTokens: number; temperature: number }): Promise<string | null> {
    if (!this.apiKey) return null;

    const endpoint = this.baseUrl.replace(/\/$/, '') + '/chat/completions';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    return data.choices?.[0]?.message?.content ?? null;
  }
}

const AI_CATEGORIES = [
  'AI Coding', 'AI Agents', 'AI Productivity', 'AI Writing',
  'AI Image', 'AI Video', 'AI Audio', 'AI Automation',
  'AI Developer Tools', 'AI Research', 'AI Models', 'Other AI Tools',
] as const;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'AI Coding': ['coding', 'programming', 'github', 'copilot', 'code', 'developer tools', 'ide', 'vscode'],
  'AI Agents': ['agent', 'autonomous', 'multi-agent', 'agentic', 'workflow automation'],
  'AI Productivity': ['productivity', 'workflow', 'task', 'efficiency', 'automation'],
  'AI Writing': ['writing', 'text generation', 'copywriting', 'content generation', 'grammar'],
  'AI Image': ['image', 'photo', 'visual', 'midjourney', 'dall-e', 'stable diffusion', 'generation'],
  'AI Video': ['video', 'movie', 'film', 'runway', 'sora', 'animation'],
  'AI Audio': ['audio', 'speech', 'voice', 'music', 'sound', 'elevenlabs', 'podcast'],
  'AI Automation': ['automation', 'rpa', 'workflow', 'bpm', 'integration'],
  'AI Developer Tools': ['sdk', 'api', 'framework', 'langchain', 'llamaindex', 'hugging face', 'open source'],
  'AI Research': ['research', 'paper', 'benchmark', 'dataset', 'arxiv', 'study'],
  'AI Models': ['model', 'llm', 'gpt', 'claude', 'gemini', 'transformer', 'language model'],
};

function deterministicCategory(title: string, content: string): { category: string; subcategory: string | null } {
  const text = `${title} ${content}`.toLowerCase();
  let bestCategory = 'Other AI Tools';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(kw => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return { category: bestCategory, subcategory: null };
}

function deterministicSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (words1.size === 0 && words2.size === 0) return 0;
  const intersection = [...words1].filter(w => words2.has(w));
  const union = new Set([...words1, ...words2]);
  return union.size === 0 ? 0 : intersection.length / union.size;
}