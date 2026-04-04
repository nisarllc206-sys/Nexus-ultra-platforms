#!/usr/bin/env ts-node
/**
 * Simple CLI for running agents locally.
 * Usage: npm run agent -- --agent AgentName --input '{"key":"value"}'
 */
import { registry } from './registry';
import { AgentRunner } from './runner';

const args = process.argv.slice(2);
const agentIdx = args.indexOf('--agent');
const inputIdx = args.indexOf('--input');
const listFlag = args.includes('--list');

const runner = new AgentRunner(registry);

if (listFlag) {
  console.log('Available agents:');
  for (const a of runner.list()) {
    console.log(`  ${a.name}: ${a.description}`);
    console.log('  Inputs:', JSON.stringify(a.inputSchema, null, 4));
    console.log();
  }
  process.exit(0);
}

const agentName = agentIdx !== -1 ? args[agentIdx + 1] : undefined;
const inputRaw = inputIdx !== -1 ? args[inputIdx + 1] : '{}';

if (!agentName) {
  console.error('Usage: npm run agent -- --agent <AgentName> --input \'{"key":"value"}\'');
  console.error('       npm run agent -- --list');
  process.exit(1);
}

let input: Record<string, unknown>;
try {
  input = JSON.parse(inputRaw) as Record<string, unknown>;
} catch (err) {
  console.error(`Failed to parse --input as JSON: ${inputRaw}\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

runner
  .run(agentName, input)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch((err: unknown) => {
    console.error('Agent run failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
