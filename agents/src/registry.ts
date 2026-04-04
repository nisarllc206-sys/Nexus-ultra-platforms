import { IAgent } from './IAgent';
import { AgentRegistry } from './runner';
import { FeatureSuggestionAgent } from './agents/FeatureSuggestionAgent';
import { QACheckAgent } from './agents/QACheckAgent';
import { ReleaseNotesAgent } from './agents/ReleaseNotesAgent';

/**
 * Central registry of all available agents.
 * Add new agents here after implementing them and ensuring they are read-only.
 */
export const registry: AgentRegistry = new Map<string, IAgent>([
  ['FeatureSuggestionAgent', new FeatureSuggestionAgent()],
  ['QACheckAgent', new QACheckAgent()],
  ['ReleaseNotesAgent', new ReleaseNotesAgent()],
]);
