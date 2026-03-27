# ⚡ Nexus Ultra Platforms

**AI-powered ecosystem for building and deploying digital products**

> Nexus Ultra Platforms is a full-stack AI platform by [Nisar LLC](mailto:nisarllc206@gmail.com) (Pakistan) — an integrated suite of tools for affiliate marketing intelligence, AI wallpaper generation, and digital business automation.

[![Deploy to GitHub Pages](https://github.com/nisarllc206-sys/Nexus-ultra-platforms/actions/workflows/deploy.yml/badge.svg)](https://github.com/nisarllc206-sys/Nexus-ultra-platforms/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Features

### 📊 Affiliate Marketing Dashboard (`src/App.js`)
- **Overview** — Revenue & clicks stats with 6-month trend charts
- **Products** — Browse and filter Amazon affiliate products (search by name/ASIN)
- **Link Manager** — Create, activate/pause, and copy affiliate links
- **AI Content Generator** — Generate SEO-optimized reviews, comparisons, roundups, and social captions powered by Claude AI

### 🎨 NEXUS WALLS — AI Wallpaper Platform (`public/walls.html`)
- **AI Generator** — Create unique wallpapers using generative canvas art (Cyberpunk, Abstract, Space, Neon, Matrix, Nature, Minimal styles)
- **Browse Gallery** — 30+ pre-generated wallpapers with filtering and search
- **4K Download** — Download any wallpaper at up to 3840×2160 resolution (free, no login required)
- **Trending & Featured** — Curated collections updated automatically

---

## 🚀 Live Demo

- **Affiliate Dashboard**: `https://nisarllc206-sys.github.io/Nexus-ultra-platforms/`
- **NEXUS WALLS**: `https://nisarllc206-sys.github.io/Nexus-ultra-platforms/walls.html`

---

## 🛠️ Setup & Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### Install & Run Locally

```bash
# Clone the repository
git clone https://github.com/nisarllc206-sys/Nexus-ultra-platforms.git
cd Nexus-ultra-platforms

# Install dependencies
npm install

# Start the development server
npm start
```

The app opens at `http://localhost:3000`.

To preview the wallpaper platform, open `public/walls.html` directly in your browser.

### Build for Production

```bash
npm run build
```

The optimized build is output to the `build/` directory.

### Environment Variables

Create a `.env` file in the project root for optional API integration:

```env
# Anthropic Claude API key (required for AI Content Generator)
REACT_APP_ANTHROPIC_API_KEY=your_api_key_here
```

> **Note**: Never commit `.env` to source control. The AI Content Generator tab will appear but content generation will fail without a valid key.

---

## 📁 Project Structure

```
Nexus-ultra-platforms/
├── public/
│   ├── index.html          # React app shell
│   └── walls.html          # NEXUS WALLS standalone HTML app
├── src/
│   ├── App.js              # Affiliate Marketing Dashboard (React)
│   └── index.js            # React entry point
├── .github/
│   └── workflows/
│       ├── deploy.yml      # GitHub Pages deployment (CI/CD)
│       ├── aws.yml         # AWS ECS deployment template
│       └── azure-webapps-node.yml  # Azure Web Apps deployment template
├── package.json
└── README.md
```

---

## ⚙️ Deployment

### GitHub Pages (Automatic)
Every push to `main` triggers the **Deploy to GitHub Pages** workflow which:
1. Installs dependencies with `npm ci`
2. Builds the React app with `npm run build`
3. Copies `public/walls.html` into the build folder
4. Deploys to GitHub Pages

> **Enable GitHub Pages**: Go to **Settings → Pages → Source → GitHub Actions**

### AWS ECS
See `.github/workflows/aws.yml` — configure `AWS_REGION`, `ECR_REPOSITORY`, `ECS_SERVICE`, `ECS_CLUSTER`, and store `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` as repository secrets.

### Azure Web Apps
See `.github/workflows/azure-webapps-node.yml` — configure `AZURE_WEBAPP_NAME` and store `AZURE_WEBAPP_PUBLISH_PROFILE` as a repository secret.

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, JavaScript (ES2022) |
| Styling | Inline CSS-in-JS (no external CSS framework) |
| AI Content | Claude API (Anthropic) |
| Wallpaper Art | HTML5 Canvas generative art |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages / AWS ECS / Azure Web Apps |

---

## 📄 License

[MIT](LICENSE) — © 2025 Nisar LLC · Pakistan
