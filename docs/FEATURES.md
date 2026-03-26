# Nexus Ultra — Features Documentation

Complete documentation of all platform features.

---

## 🤖 AI Tools Directory

The AI Tools Directory contains 50+ curated AI tools across 8 categories.

### Categories

| Category | Tools | Description |
|----------|-------|-------------|
| Content & Writing | ChatGPT, Claude, Gemini, Copy.ai, Jasper, Character.AI | Text generation and writing assistants |
| Design & Art | Midjourney, DALL-E, Stable Diffusion, Adobe Firefly, Canva | Image and design generation |
| Video & Media | Runway ML, Pika Labs, HeyGen, CapCut, Synthesia | Video creation and editing |
| Audio & Music | ElevenLabs, Suno AI, Udio, Descript, AIVA | Voice synthesis and music generation |
| Coding & Dev | GitHub Copilot, Cursor, Replit | AI-assisted development tools |
| Productivity | Notion AI, Perplexity, Otter.ai, Fireflies, Krisp | Workflow and productivity tools |
| Presentation | Gamma, Tome, Beautiful.ai, SlidesAI | Presentation creation tools |
| Website Builder | Framer AI, Wix ADI, 10Web | AI website builders |

### Tool Data Structure

Each tool in the directory contains:

```json
{
  "id":          "unique-identifier",
  "name":        "Tool Name",
  "category":    "Content & Writing",
  "description": "What this tool does...",
  "url":         "https://tool-url.com",
  "rating":      4.7,
  "reviews":     50000,
  "free":        true,
  "useCases":    ["Use case 1", "Use case 2"],
  "tags":        ["tag1", "tag2", "tag3"]
}
```

### Features
- **Real-time search** — Search by name, description, tags, or use case
- **Category filtering** — Filter by any of 8 categories
- **Sorting** — Sort by rating, reviews, name, or free-first
- **Grid / List views** — Switch between card grid and list layout
- **Favorites** — Save tools to your favorites (persisted in localStorage and Firestore)
- **Tool detail modal** — See full tool information with use cases and tags
- **Load more** — Pagination (12 tools per page)

---

## ✍️ Content Generator

Generate high-quality content using Claude AI in 6 different formats.

### Content Types

| Type | Icon | Description | Ideal For |
|------|------|-------------|-----------|
| Blog Post | 📝 | Full SEO-optimized blog post (800-1200 words) | Content marketing, SEO |
| Social Media | 📱 | Platform-specific posts (Instagram, LinkedIn, X, Facebook) | Social media marketing |
| Email | 📧 | Full email with subject, preview, body, and CTA | Email marketing campaigns |
| Product Description | 🏷️ | Conversion-focused product copy | eCommerce, product pages |
| YouTube Script | 🎬 | Full video script with hooks, chapters, and CTAs | YouTube content creators |
| X Thread | 🐦 | Viral 10-12 tweet threads | Twitter/X growth |

### Tone Options
- Professional
- Casual & Friendly
- Persuasive
- Educational
- Humorous

### AI Models

| Model | Best For | Speed |
|-------|----------|-------|
| Claude 3.5 Sonnet | Best overall quality (recommended) | Fast |
| Claude 3 Haiku | Quick drafts, high volume | Very Fast |
| Claude 3 Opus | Maximum quality, complex tasks | Slower |

### Features
- **Streaming output** — See content generate word-by-word
- **Copy to clipboard** — One-click copy
- **Download as .txt** — Save to file
- **Save to history** — Persist in browser and Firestore
- **Character counter** — 2,000 character prompt limit display
- **Loading states** — Animated AI thinking indicator

---

## 📊 Dashboard

Central command center for managing your creator workflow.

### Stats Cards
- **Content Generated** — Total pieces created all-time
- **Tools Used** — Number of unique tools accessed
- **Monthly Usage** — Current month generations vs plan limit (with progress bar)
- **Account Status** — Current plan with upgrade CTA

### Quick Actions
- Generate Content (shortcut to generator)
- Browse AI Tools (links to tools.html)
- View Analytics
- My Favorites

### Recent Content Table
- Shows last 5 generated items
- Columns: Type, Prompt Preview, Model, Date, Actions
- Actions: View full content, Copy, Delete

---

## 📈 Analytics

Visual overview of content creation activity.

### Charts
1. **Content by Type** — Bar chart showing generations per content type
2. **Weekly Activity** — Bar chart for the last 7 days
3. **Usage Summary** — Total metrics (this month, all-time, total words)

---

## ❤️ Favorites

Save and access your most-used AI tools.

- Saved via the ♡ button on any tool card
- Persisted in `localStorage` as `nexus_favorites`
- Shows tool avatar, name, category, description, and "Visit Tool" link
- Remove favorites with the heart button in the Favorites panel

---

## ⚙️ Settings

### Profile Settings
- Update display name
- View email (read-only from auth provider)

### Appearance
- Toggle light/dark theme (syncs with system and localStorage)

### API Keys
- Enter your own Anthropic API key for direct API calls
- Keys stored locally in browser (never sent to our servers unless using proxy)

---

## 💳 Payments (Stripe)

### Plans

#### Free ($0/month)
- 50 AI content generations/month
- Access to 20 AI tools
- Basic dashboard
- 5 saved favorites

#### Pro ($29/month or $23/month billed annually)
- Unlimited AI generations
- All 50+ AI tools
- Advanced analytics
- Priority support
- Unlimited favorites
- WhatsApp automation (500 messages)
- API access

#### Enterprise ($99/month or $79/month billed annually)
- Everything in Pro
- 10 team seats
- Custom AI fine-tuning
- Dedicated account manager
- SLA 99.99% uptime
- Unlimited WhatsApp messages
- White-label option

### Billing
- Annual billing saves 20%
- Manage subscription via Stripe Customer Portal
- Invoice download via Stripe Portal

---

## 💬 WhatsApp Automation

Automate customer communications via WhatsApp Business API.

### Features
- **Lead Capture Widget** — Embeddable form for collecting WhatsApp leads
- **Floating Button** — Persistent WhatsApp chat button on any page
- **Auto-Reply Bot** — Responds to commands: TOOLS, PRICING, DEMO, SUPPORT
- **Template Messages** — Send approved templates (welcome, upgrade reminder, etc.)
- **Lead Storage** — All leads saved to Firestore with contact info and intent

### Command Responses
- `HELLO` / `HI` — Welcome message with navigation options
- `TOOLS` — List of top AI tools
- `PRICING` — Plan comparison
- `DEMO` — Free trial invitation
- `SUPPORT` — Support contact information

---

## 🔐 Authentication (Firebase)

### Sign-in Methods
- Email & password (with validation)
- Google OAuth (one-click)

### Security
- Firebase Security Rules protect all user data
- ID tokens verified server-side for API calls
- Passwords managed by Firebase (never stored in our database)
- Session persisted via Firebase `onAuthStateChanged`

---

## 🎨 Theme System

### Themes
- **Dark mode** (default) — Deep navy/purple palette
- **Light mode** — Clean white/blue palette

### Storage
- Theme preference saved to `localStorage` as `theme`
- Applied immediately via `data-theme` attribute on `<body>`
- Toggle in: navbar, sidebar footer, settings panel

### CSS Custom Properties
All colors, spacing, shadows, and typography are defined as CSS custom properties in `public/css/styles.css` and overridden in `public/css/themes/dark.css` and `light.css`.
