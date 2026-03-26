/**
 * content-generator.js — AI Content Generation Module
 * Handles prompt templates, API calls to Claude, streaming responses,
 * copy/download/save functionality, and history management.
 */

// ─── Content Type Configurations ─────────────────────────────────────────────
const CONTENT_TYPES = {
  blog: {
    label:    'Blog Post',
    icon:     'fa-blog',
    template: (prompt, tone) => `You are an expert content writer. Write a comprehensive, well-structured blog post about the following topic.

Topic: ${prompt}
Tone: ${tone}

Requirements:
- Engaging title with power words
- Compelling introduction with a hook
- 4-6 main sections with clear H2 headings
- Practical, actionable insights in each section
- Real-world examples where relevant
- Strong conclusion with a call to action
- Approximately 800-1200 words
- SEO-friendly structure

Write the complete blog post now:`,
  },
  social: {
    label:    'Social Media',
    icon:     'fa-instagram',
    template: (prompt, tone) => `You are a social media content strategist. Create engaging social media content for the following.

Topic/Product/Service: ${prompt}
Tone: ${tone}

Create the following:
1. Instagram caption (150-200 characters + 10 relevant hashtags)
2. LinkedIn post (professional, 200-300 characters)
3. Twitter/X post (under 280 characters, punchy)
4. Facebook post (conversational, 100-150 words)

Format each clearly with the platform name as a header.`,
  },
  email: {
    label:    'Email',
    icon:     'fa-envelope',
    template: (prompt, tone) => `You are an email marketing expert. Write a high-converting email for the following purpose.

Purpose/Topic: ${prompt}
Tone: ${tone}

Write a complete email including:
- Subject line (attention-grabbing, under 60 characters)
- Preview text (under 90 characters)
- Opening (personalized greeting + hook)
- Body (value proposition, 3-4 paragraphs)
- CTA (clear, compelling button text + surrounding copy)
- Signature

Make it scannable with short paragraphs.`,
  },
  product: {
    label:    'Product Description',
    icon:     'fa-tag',
    template: (prompt, tone) => `You are a conversion copywriter specializing in product descriptions. Write a compelling product description for:

Product: ${prompt}
Tone: ${tone}

Include:
- Punchy headline (benefit-focused)
- 2-3 sentence overview highlighting the main value
- Key Features section (5-7 bullet points, benefit-led)
- Who it's for section
- Short closing statement with urgency/CTA
- Meta description (under 160 characters) for SEO

Make it persuasive and conversion-focused.`,
  },
  youtube: {
    label:    'YouTube Script',
    icon:     'fa-youtube',
    template: (prompt, tone) => `You are a YouTube scriptwriter for top creators. Write an engaging video script for:

Topic: ${prompt}
Tone: ${tone}

Script structure:
- HOOK (first 15 seconds) — pattern interrupt or bold statement
- INTRO (30 seconds) — who this video is for and what they'll learn
- MAIN CONTENT (3-5 chapters with timestamps like [0:00])
  * Each chapter: key point + explanation + example
- ENGAGEMENT prompt (ask viewers a question to comment)
- OUTRO (30 seconds) — recap + CTA (like, subscribe, next video)

Format with clear section headers. Approximately 5-8 minutes of content.`,
  },
  thread: {
    label:    'X Thread',
    icon:     'fa-x-twitter',
    template: (prompt, tone) => `You are a viral X (Twitter) thread writer. Create an engaging, educational thread on:

Topic: ${prompt}
Tone: ${tone}

Write a 10-12 tweet thread:
- Tweet 1: Hook tweet (bold claim or surprising stat) — must make people click "show more"
- Tweets 2-10: Each tweet = one key insight or step (under 280 chars each)
- Final tweet: Summary + CTA (follow/retweet)

Format as:
1/ [tweet text]
2/ [tweet text]
...

Use line breaks within tweets for readability. Make each tweet standalone but part of the narrative flow.`,
  },
};

// ─── History Management ───────────────────────────────────────────────────────
export const History = {
  KEY: 'nexus_content_history',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || '[]');
    } catch {
      return [];
    }
  },

  save(entry) {
    const history = this.getAll();
    history.unshift({ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    if (history.length > 100) history.splice(100);
    localStorage.setItem(this.KEY, JSON.stringify(history));
    return entry;
  },

  delete(id) {
    const history = this.getAll().filter(e => e.id !== id);
    localStorage.setItem(this.KEY, JSON.stringify(history));
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },

  getStats() {
    const all = this.getAll();
    const byType = {};
    all.forEach(({ contentType }) => {
      byType[contentType] = (byType[contentType] || 0) + 1;
    });
    return { total: all.length, byType };
  },
};

// ─── Content Generator Class ──────────────────────────────────────────────────
export class ContentGenerator {
  constructor(options = {}) {
    this.apiEndpoint = options.apiEndpoint || '/api/generate';
    this.onStart     = options.onStart     || (() => {});
    this.onChunk     = options.onChunk     || (() => {});
    this.onComplete  = options.onComplete  || (() => {});
    this.onError     = options.onError     || (() => {});
    this.abortCtrl   = null;
  }

  /**
   * Generate content using the configured API endpoint.
   * Attempts streaming first, falls back to standard request.
   */
  async generate({ prompt, contentType, model, tone = 'professional' }) {
    if (!prompt.trim()) {
      this.onError('Please enter a prompt before generating.');
      return;
    }

    const typeConfig = CONTENT_TYPES[contentType] || CONTENT_TYPES.blog;
    const fullPrompt = typeConfig.template(prompt.trim(), tone);

    this.abortCtrl = new AbortController();
    this.onStart({ contentType, model, prompt });

    try {
      const resp = await fetch(this.apiEndpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  this.abortCtrl.signal,
        body: JSON.stringify({ prompt: fullPrompt, contentType, model, stream: true }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'API request failed' }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      // Handle streaming response
      if (resp.headers.get('content-type')?.includes('text/event-stream')) {
        await this._handleStream(resp);
      } else {
        const data = await resp.json();
        this.onChunk(data.content || '');
        this.onComplete(data.content || '', { contentType, model, prompt });
        return data.content;
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      // Demo mode fallback — generate placeholder content
      const demo = this._getDemoContent(contentType, prompt);
      this.onChunk(demo);
      this.onComplete(demo, { contentType, model, prompt });
    }
  }

  async _handleStream(response) {
    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText  = '';
    let buffer    = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            this.onComplete(fullText, {});
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const chunk  = parsed.delta?.text || parsed.content || '';
            if (chunk) {
              fullText += chunk;
              this.onChunk(chunk);
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (fullText) this.onComplete(fullText, {});
  }

  abort() {
    this.abortCtrl?.abort();
  }

  // Demo content for when API is not configured
  _getDemoContent(type, prompt) {
    const demos = {
      blog: `# ${prompt || 'AI Content Creation in 2025'}

## The AI Revolution Is Here

Artificial intelligence has fundamentally transformed how we create content in 2025. From blog posts to full marketing campaigns, AI tools are enabling creators to produce 10x more content without sacrificing quality.

## Key Trends to Watch

**1. Personalization at Scale**
AI systems can now tailor content to individual readers based on their behavior, preferences, and location — in real time.

**2. Multimodal Content Creation**
The next generation of AI tools creates text, images, audio, and video simultaneously from a single prompt.

**3. AI Collaboration, Not Replacement**
The most successful creators use AI as a thinking partner — generating drafts, ideas, and research that humans refine and personalize.

## How to Get Started Today

Start small. Pick one content type — blog posts, social captions, or email sequences — and use AI to draft the first version. You'll immediately reclaim 60-70% of your production time.

## Conclusion

The creators who embrace AI tools today will dominate their niches tomorrow. The barrier to entry for high-quality content has never been lower. Start building your AI-powered workflow now.`,

      social: `📱 **Instagram Caption:**
Imagine creating a month of content in a single afternoon. That's the power of AI tools for creators. Which platform do you want to master first? 👇

#AITools #ContentCreator #DigitalMarketing #CreatorEconomy #AIContent #MarketingTips #ContentStrategy #SocialMediaMarketing #CreatorLife #FutureOfContent

---

💼 **LinkedIn:**
The creators who are winning in 2025 have one thing in common: they're using AI to amplify their output, not replace their creativity.

---

🐦 **X (Twitter):**
Hot take: Creators who don't use AI tools in 2025 are competing at a 10x disadvantage. The playing field has shifted. ⚡

---

📘 **Facebook:**
Hey creators! Have you started using AI tools in your workflow yet? I've been experimenting with several platforms and the time savings are incredible. Drop a 🙋 in the comments if you'd like me to share my exact AI content stack!`,

      email: `**Subject:** The secret tool stack changing everything for creators 🚀
**Preview:** 10x your content output this week...

---

Hey [First Name],

I'm going to cut straight to it — most creators are still spending 4-6 hours on a single piece of content that AI could draft in 4 minutes.

Here's what I've discovered after testing 30+ AI tools:

**The 3 tools that actually move the needle:**

1. **Nexus Ultra** — AI content generator + tools directory in one platform
2. **Claude AI** — For long-form, nuanced writing
3. **Canva AI** — For instant visuals that match your brand

Together, these three tools have cut my content creation time by 78%. No exaggeration.

**Why this matters for you:**

More content = more reach = more revenue. It's that simple.

[**Get Started Free →**]

To your growth,
[Your Name]

P.S. The free plan on Nexus Ultra includes 50 content generations per month. No credit card required.`,
    };
    return demos[type] || demos.blog;
  }
}

// ─── Initialize Content Generator UI (used in dashboard.html) ────────────────
export function initGeneratorUI() {
  const generateBtn     = document.getElementById('generateBtn');
  const promptInput     = document.getElementById('promptInput');
  const modelSelect     = document.getElementById('modelSelect');
  const toneSelect      = document.getElementById('toneSelect');
  const outputPlaceholder = document.getElementById('outputPlaceholder');
  const outputLoading   = document.getElementById('outputLoading');
  const outputContent   = document.getElementById('outputContent');
  const outputText      = document.getElementById('outputText');
  const outputActions   = document.getElementById('outputActions');
  const charCount       = document.getElementById('charCount');
  const copyBtn         = document.getElementById('copyBtn');
  const downloadBtn     = document.getElementById('downloadBtn');
  const saveBtn         = document.getElementById('saveBtn');

  if (!generateBtn) return;

  let currentType    = 'blog';
  let currentContent = '';

  // Character counter
  promptInput?.addEventListener('input', () => {
    const len = promptInput.value.length;
    charCount && (charCount.textContent = len);
    if (len > 2000) promptInput.value = promptInput.value.slice(0, 2000);
  });

  // Content type selection
  document.querySelectorAll('.content-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.content-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
    });
  });

  const generator = new ContentGenerator({
    apiEndpoint: '/api/generate',

    onStart() {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
      outputPlaceholder && (outputPlaceholder.style.display = 'none');
      outputLoading && (outputLoading.style.display = 'flex');
      outputContent && (outputContent.style.display = 'none');
      outputActions && (outputActions.style.display = 'none');
      currentContent = '';
    },

    onChunk(chunk) {
      currentContent += chunk;
      if (outputLoading)  outputLoading.style.display  = 'none';
      if (outputContent)  outputContent.style.display  = 'block';
      if (outputText)     outputText.textContent        = currentContent;
    },

    onComplete(text, meta) {
      currentContent = text;
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="fa-solid fa-sparkles"></i> Generate Content';
      if (outputLoading) outputLoading.style.display = 'none';
      if (outputContent) outputContent.style.display = 'block';
      if (outputText)    outputText.textContent = text;
      if (outputActions) outputActions.style.display = 'flex';

      // Update usage stats
      const count = parseInt(localStorage.getItem('nexus_usage_count') || '0') + 1;
      localStorage.setItem('nexus_usage_count', count);
    },

    onError(msg) {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="fa-solid fa-sparkles"></i> Generate Content';
      if (outputLoading) outputLoading.style.display = 'none';
      if (outputPlaceholder) {
        outputPlaceholder.style.display = 'flex';
        outputPlaceholder.querySelector('p').textContent = msg || 'Generation failed. Please try again.';
      }
    },
  });

  // Generate button click
  generateBtn.addEventListener('click', () => {
    const prompt = promptInput?.value?.trim();
    const model  = modelSelect?.value  || 'claude-3-5-sonnet-20241022';
    const tone   = toneSelect?.value   || 'professional';
    generator.generate({ prompt, contentType: currentType, model, tone });
  });

  // Copy to clipboard
  copyBtn?.addEventListener('click', async () => {
    if (!currentContent) return;
    await navigator.clipboard.writeText(currentContent);
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    setTimeout(() => { copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy'; }, 2000);
  });

  // Download as .txt
  downloadBtn?.addEventListener('click', () => {
    if (!currentContent) return;
    const blob = new Blob([currentContent], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `nexus-content-${currentType}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Save to history
  saveBtn?.addEventListener('click', () => {
    if (!currentContent) return;
    const model = modelSelect?.value || 'claude-3-5-sonnet-20241022';
    const prompt = promptInput?.value?.trim() || '';
    History.save({
      contentType: currentType,
      model,
      prompt:      prompt.slice(0, 100),
      content:     currentContent,
      wordCount:   currentContent.split(/\s+/).filter(Boolean).length,
    });
    saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
    setTimeout(() => { saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Save'; }, 2000);
  });
}
