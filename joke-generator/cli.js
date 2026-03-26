#!/usr/bin/env node
/**
 * Random Joke Generator – CLI
 * Uses JokeAPI (https://v2.jokeapi.dev/)
 *
 * Usage:
 *   node cli.js                         # random joke, any category
 *   node cli.js --category Programming  # jokes from a specific category
 *   node cli.js --type twopart          # two-part (Q&A) jokes only
 *   node cli.js --count 3               # fetch multiple jokes at once
 *   node cli.js --list-categories       # list available categories
 */

'use strict';

const https = require('https');
const { URL } = require('url');

// ── ANSI colour helpers ────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  purple: '\x1b[35m',
};
const paint = (color, str) => `${color}${str}${c.reset}`;

// ── Available categories ───────────────────────────────────────────────────
const CATEGORIES = ['Any', 'Programming', 'Misc', 'Dark', 'Pun', 'Spooky', 'Christmas'];
const TYPES      = ['single', 'twopart'];

// ── Parse CLI arguments ────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { category: 'Any', type: null, count: 1, listCategories: false };
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--category': args.category = argv[++i] || 'Any'; break;
      case '--type':     args.type     = argv[++i] || null;  break;
      case '--count': {
        const n = parseInt(argv[++i], 10);
        if (isNaN(n) || n < 1) { console.error(`✖  Error: --count must be a number between 1 and 10`); process.exit(1); }
        args.count = Math.min(10, n);
        break;
      }
      case '--list-categories': args.listCategories = true; break;
      case '--help': printHelp(); process.exit(0); break;
    }
  }
  return args;
}

function printHelp() {
  console.log(`
${paint(c.cyan + c.bold, '😂  Random Joke Generator – CLI')}

${paint(c.bold, 'USAGE')}
  node cli.js [options]

${paint(c.bold, 'OPTIONS')}
  --category  <name>   Joke category (default: Any)
  --type      <type>   Joke type: single | twopart (default: any)
  --count     <n>      Number of jokes to fetch (1–10, default: 1)
  --list-categories    Show all available categories
  --help               Show this help message

${paint(c.bold, 'EXAMPLES')}
  node cli.js
  node cli.js --category Programming
  node cli.js --type twopart --count 3
  `);
}

// ── HTTP helper ────────────────────────────────────────────────────────────
/**
 * Fetch a URL and return the parsed JSON body.
 * @param {string} url
 * @returns {Promise<object>}
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { 'Accept': 'application/json', 'User-Agent': 'NexusJokeCLI/1.0' },
    };

    const req = https.get(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Failed to parse JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out after 10s'));
    });
  });
}

// ── Build API URL ──────────────────────────────────────────────────────────
function buildUrl(category, type, count) {
  const cat = encodeURIComponent(category || 'Any');
  let url = `https://v2.jokeapi.dev/joke/${cat}?safe-mode`;
  if (type && TYPES.includes(type)) url += `&type=${type}`;
  if (count > 1) url += `&amount=${count}`;
  return url;
}

// ── Display helpers ────────────────────────────────────────────────────────
function printJoke(joke, index, total) {
  const prefix = total > 1 ? paint(c.dim, `[${index + 1}/${total}] `) : '';
  const cat    = paint(c.cyan, `[${joke.category}]`);
  console.log('');
  if (joke.type === 'twopart') {
    console.log(`${prefix}${cat}`);
    console.log(paint(c.bold, joke.setup));
    console.log(paint(c.dim, '  ...'));
    console.log(paint(c.yellow, joke.delivery));
  } else {
    console.log(`${prefix}${cat}`);
    console.log(paint(c.bold, joke.joke));
  }
}

function printError(message) {
  console.error(`\n${paint(c.red, '✖  Error:')} ${message}\n`);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);

  if (args.listCategories) {
    console.log(`\n${paint(c.cyan + c.bold, 'Available categories:')}`);
    CATEGORIES.forEach(cat => console.log(`  ${paint(c.green, '•')} ${cat}`));
    console.log('');
    return;
  }

  // Validate category
  const normalised = CATEGORIES.find(
    cat => cat.toLowerCase() === (args.category || '').toLowerCase()
  );
  if (!normalised) {
    printError(`Unknown category "${args.category}". Use --list-categories to see valid options.`);
    process.exit(1);
  }

  const url = buildUrl(normalised, args.type, args.count);

  process.stdout.write(paint(c.dim, 'Fetching joke(s)…'));

  let data;
  try {
    data = await fetchJson(url);
  } catch (err) {
    process.stdout.write('\r' + ' '.repeat(30) + '\r');
    printError(err.message);
    process.exit(1);
  }

  process.stdout.write('\r' + ' '.repeat(30) + '\r');

  if (data.error) {
    printError(data.message || 'API returned an error');
    process.exit(1);
  }

  // JokeAPI returns an array when amount > 1
  const jokes = data.jokes || [data];
  jokes.forEach((joke, i) => printJoke(joke, i, jokes.length));
  console.log('');
}

main().catch(err => {
  printError(err.message);
  process.exit(1);
});
