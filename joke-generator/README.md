# 😂 Random Joke Generator

A fully functional random joke generator that fetches jokes from [JokeAPI](https://v2.jokeapi.dev/). Available as both a **responsive web app** and a **Node.js CLI tool**.

---

## Features

- 🎲 Random jokes from multiple categories
- 🔀 Supports both single and two-part (Q&A) joke formats
- 🛡️ Safe-mode enabled by default
- ⚡ Loading states and comprehensive error handling
- 📋 Copy-to-clipboard and Web Share API support (web)
- 🎨 Responsive, dark-themed UI
- 🖥️ Works in both browser and terminal

---

## Web App

Open `index.html` in any modern browser — no server or build step required.

### Controls

| Control | Description |
|---------|-------------|
| **Category** | Filter jokes by topic (Programming, Pun, Spooky, etc.) |
| **Type** | Single-line jokes or two-part Q&A jokes |
| **Get Joke** | Fetch a new random joke |
| **Copy** | Copy joke text to clipboard |
| **Share** | Share via Web Share API (mobile) or clipboard fallback |

---

## CLI Tool

**Requirements:** Node.js 12 or later (no external dependencies — uses built-in `https` module).

### Usage

```bash
# Random joke, any category
node cli.js

# Filter by category
node cli.js --category Programming

# Fetch multiple jokes at once (up to 10)
node cli.js --count 3

# Only two-part (Q&A) jokes
node cli.js --type twopart

# Combine options
node cli.js --category Pun --type twopart --count 5

# List all available categories
node cli.js --list-categories

# Show help
node cli.js --help
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--category <name>` | Joke category | `Any` |
| `--type <type>` | `single` or `twopart` | Any |
| `--count <n>` | Number of jokes (1–10) | `1` |
| `--list-categories` | Print all available categories | — |
| `--help` | Show help | — |

### Available Categories

| Category | Description |
|----------|-------------|
| `Any` | All categories (default) |
| `Programming` | Developer / coding jokes |
| `Misc` | Miscellaneous humour |
| `Dark` | Dark humour |
| `Pun` | Wordplay and puns |
| `Spooky` | Halloween-themed jokes |
| `Christmas` | Christmas jokes |

---

## API

This generator uses [JokeAPI v2](https://v2.jokeapi.dev/) — a free, no-auth-required REST API.

**Endpoint used:**
```
GET https://v2.jokeapi.dev/joke/{category}?safe-mode[&type={type}][&amount={n}]
```

The `safe-mode` flag filters out explicit content.

---

## Project Structure

```
joke-generator/
├── index.html   # Responsive web app (no build step)
├── cli.js       # Node.js CLI tool (no dependencies)
└── README.md    # This file
```
