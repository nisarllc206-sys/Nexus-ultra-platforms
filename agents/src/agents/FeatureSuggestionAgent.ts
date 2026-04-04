import { IAgent, AgentInput, AgentResult } from '../IAgent';

interface TelemetryEvent {
  type: string;
  payload?: Record<string, unknown>;
}

interface FeedbackEntry {
  message: string;
  rating?: number;
}

/**
 * FeatureSuggestionAgent
 *
 * Summarizes telemetry events and user feedback into a prioritized list of
 * suggested backlog items. This agent is purely read-only — it does NOT
 * write to any external system.
 */
export class FeatureSuggestionAgent implements IAgent {
  readonly name = 'FeatureSuggestionAgent';
  readonly description =
    'Summarizes telemetry events and user feedback into suggested product backlog items.';
  readonly inputSchema = {
    events: 'Array of telemetry event objects ({ type: string, payload?: object })',
    feedback: 'Array of feedback entries ({ message: string, rating?: number }) or plain strings',
  };

  async run(input: AgentInput): Promise<AgentResult> {
    const events = (input.events as TelemetryEvent[] | undefined) ?? [];
    const rawFeedback = (input.feedback as (FeedbackEntry | string)[] | undefined) ?? [];

    // Normalise feedback to strings
    const feedbackMessages: string[] = rawFeedback.map((f) =>
      typeof f === 'string' ? f : f.message,
    );

    // Frequency-count event types
    const eventCounts: Record<string, number> = {};
    for (const e of events) {
      eventCounts[e.type] = (eventCounts[e.type] ?? 0) + 1;
    }

    // Build backlog suggestions based on heuristics
    const suggestions: string[] = [];

    // High-frequency event types suggest friction points
    for (const [type, count] of Object.entries(eventCounts)) {
      if (count >= 3) {
        suggestions.push(
          `Investigate high-frequency event "${type}" (${count} occurrences) — possible UX friction or performance issue.`,
        );
      }
    }

    // Extract themes from feedback using simple keyword scanning
    const keywords: Record<string, string> = {
      slow: 'Performance improvement requested',
      crash: 'Stability fix needed',
      'dark mode': 'Dark mode feature requested',
      'dark-mode': 'Dark mode feature requested',
      export: 'Export functionality requested',
      login: 'Authentication / login improvement requested',
      offline: 'Offline support requested',
      notification: 'Push notification feature requested',
    };

    const seen = new Set<string>();
    for (const msg of feedbackMessages) {
      const lower = msg.toLowerCase();
      for (const [kw, suggestion] of Object.entries(keywords)) {
        if (lower.includes(kw) && !seen.has(suggestion)) {
          seen.add(suggestion);
          suggestions.push(suggestion);
        }
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('No strong signals detected — continue monitoring.');
    }

    return {
      success: true,
      summary: `Generated ${suggestions.length} backlog suggestion(s) from ${events.length} event(s) and ${feedbackMessages.length} feedback entry/entries.`,
      data: {
        suggestions,
        eventSummary: eventCounts,
        feedbackCount: feedbackMessages.length,
      },
    };
  }
}
