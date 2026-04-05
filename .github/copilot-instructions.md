# GitHub Copilot Instructions for Nexus Ultra Platforms

## Project Overview

**Nexus Ultra Platforms** is an AI-powered digital ecosystem built by Nisar LLC (Pakistan). It includes:

- **Affiliate Marketing Dashboard** – A React-based SPA for tracking Amazon Associates products, managing affiliate links, and generating AI-driven content via Claude (Anthropic API).
- **NEXUS WALLS** – An HTML/CSS/JS wallpaper platform featuring an AI wallpaper generator, curated gallery, trending section, and API key management.

## Tech Stack

- **Frontend (Dashboard):** React (functional components, hooks), inline styles
- **Frontend (Walls):** Vanilla HTML5, CSS3 (CSS custom properties), JavaScript (Canvas API)
- **AI Integration:** Anthropic Claude API (`claude-sonnet-4-20250514`) for affiliate content generation
- **Fonts:** Orbitron, Rajdhani, Share Tech Mono (Google Fonts)
- **Deployment targets:** Vercel, AWS ECS (via GitHub Actions), Azure Web Apps

## Code Conventions

- React components use **inline styles** via a style object (`const s = { ... }`) rather than CSS files or Tailwind.
- Color tokens are defined in a top-level `clr` constant: `purple`, `blue`, `pink`, `green`, `yellow`, `red`, `dark`, `card`, `border`.
- CSS custom properties (CSS variables) are used in the vanilla HTML app under `:root` (e.g. `--cyan`, `--purple`, `--pink`, `--green`, `--gold`).
- Data (products, months, revenue) is defined as top-level `const` arrays/objects.
- Notification state (`notification`) is displayed as a fixed overlay and auto-dismissed after 2800 ms.
- The affiliate dashboard uses `tabs` state to switch between: `overview`, `products`, `links`, `ai`.

## Key Data Structures

```js
// Product record (affiliate dashboard)
{ asin, name, category, commission, clicks, conversions, revenue, trend, img }

// Link record (link manager)
{ id, name, asin, url, clicks, active }

// AI content template
{ id, label, icon }
```

## AI Content Generation

The `generateContent` function calls the Anthropic Messages API directly from the browser:

- Endpoint: `https://api.anthropic.com/v1/messages`
- Model: `claude-sonnet-4-20250514`
- The API key must be configured by the user (stored client-side in the settings modal for the Walls app).

## Directory Structure (Target)

```
/
├── .github/
│   ├── copilot-instructions.md
│   ├── workflows/
│   │   ├── aws.yml            # Deploy to Amazon ECS
│   │   └── azure-webapps-node.yml
│   └── ISSUE_TEMPLATE/
├── src/
│   └── App.jsx                # React affiliate dashboard
├── public/
│   └── index.html             # NEXUS WALLS wallpaper platform
├── README.md
└── package.json               # (to be added)
```

## Brand Identity

- Brand name: **Nexus Ultra Platforms – Singularity System**
- Primary palette: cyan (`#00f5ff`), purple (`#bf00ff`), pink (`#ff0080`), green (`#00ff88`)
- Typography: Orbitron (headings/UI), Rajdhani (body), Share Tech Mono (code/mono)
- Tagline: *"Affiliate Marketing Intelligence · Nisar LLC · Pakistan"*

## Coding Guidelines for Copilot

1. Prefer **functional React components** with hooks; no class components.
2. Use the existing `clr` / CSS variable color tokens — do not introduce new hard-coded hex values.
3. Keep AI prompts conversion-focused and SEO-optimized per the project's affiliate marketing goal.
4. New affiliate product entries must include all fields: `asin`, `name`, `category`, `commission`, `clicks`, `conversions`, `revenue`, `trend`, `img`.
5. Error states in async functions should update UI with a human-readable message (e.g. `"⚠️ Error generating content. Please try again."`).
6. Canvas-based wallpapers in the Walls app use the HTML5 Canvas 2D API — keep rendering logic inside dedicated draw functions.
7. GitHub Actions workflows target `main` branch pushes for production deploys.
