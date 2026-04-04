import { IAgent, AgentInput, AgentResult } from '../IAgent';

/**
 * ReleaseNotesAgent
 *
 * Generates human-readable release notes from a list of merged PR titles or a
 * raw changelog string. Read-only: produces text output only, no external writes.
 *
 * Input:
 *  - version (string): the release version label, e.g. "v0.2.0"
 *  - prTitles (string[]): list of merged PR titles
 *  - changelog (string): optional raw changelog text (used if prTitles is empty)
 *  - date (string): release date (default: today's ISO date)
 */
export class ReleaseNotesAgent implements IAgent {
  readonly name = 'ReleaseNotesAgent';
  readonly description =
    'Generates release notes from merged PR titles or a provided changelog string.';
  readonly inputSchema = {
    version: 'Release version string, e.g. "v0.2.0"',
    prTitles: 'Array of merged PR title strings',
    changelog: 'Optional raw changelog text (fallback when prTitles is empty)',
    date: 'Release date string (default: today)',
  };

  async run(input: AgentInput): Promise<AgentResult> {
    const version = typeof input.version === 'string' ? input.version : 'vX.Y.Z';
    const date =
      typeof input.date === 'string'
        ? input.date
        : new Date().toISOString().slice(0, 10);
    const prTitles = Array.isArray(input.prTitles)
      ? (input.prTitles as unknown[]).map(String)
      : [];
    const changelog = typeof input.changelog === 'string' ? input.changelog : '';

    let notes: string;

    if (prTitles.length > 0) {
      const categorised = this.categorise(prTitles);
      const sections: string[] = [];

      for (const [category, items] of Object.entries(categorised)) {
        if (items.length > 0) {
          sections.push(`### ${category}\n${items.map((t) => `- ${t}`).join('\n')}`);
        }
      }

      notes =
        `## ${version} — ${date}\n\n` +
        (sections.length > 0
          ? sections.join('\n\n')
          : '- Various improvements and bug fixes.');
    } else if (changelog) {
      notes = `## ${version} — ${date}\n\n${changelog}`;
    } else {
      notes = `## ${version} — ${date}\n\n- No changes recorded.`;
    }

    return {
      success: true,
      summary: `Generated release notes for ${version}.`,
      data: { version, date, notes, prCount: prTitles.length },
    };
  }

  /** Rudimentary categorisation by prefix/keywords. */
  private categorise(titles: string[]): Record<string, string[]> {
    const buckets: Record<string, string[]> = {
      '🚀 Features': [],
      '🐛 Bug Fixes': [],
      '🔧 Chores & Maintenance': [],
      '📖 Documentation': [],
      '🔒 Security': [],
      '⚡ Performance': [],
    };

    for (const title of titles) {
      const lower = title.toLowerCase();
      if (/^feat[:(]|feature|add|new\b/.test(lower)) {
        buckets['🚀 Features'].push(title);
      } else if (/^fix[:(]|bug|patch|resolve|revert/.test(lower)) {
        buckets['🐛 Bug Fixes'].push(title);
      } else if (/^docs?[:(]|readme|documentation|changelog/.test(lower)) {
        buckets['📖 Documentation'].push(title);
      } else if (/^sec[:(]|security|cve|vulnerab/.test(lower)) {
        buckets['🔒 Security'].push(title);
      } else if (/^perf[:(]|performance|speed|optim/.test(lower)) {
        buckets['⚡ Performance'].push(title);
      } else {
        buckets['🔧 Chores & Maintenance'].push(title);
      }
    }

    return buckets;
  }
}
