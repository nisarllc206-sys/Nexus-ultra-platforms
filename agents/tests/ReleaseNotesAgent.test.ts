import { ReleaseNotesAgent } from '../src/agents/ReleaseNotesAgent';

describe('ReleaseNotesAgent', () => {
  const agent = new ReleaseNotesAgent();

  it('has correct name', () => {
    expect(agent.name).toBe('ReleaseNotesAgent');
  });

  it('generates notes from PR titles', async () => {
    const result = await agent.run({
      version: 'v1.0.0',
      prTitles: ['feat: add dark mode', 'fix: login crash', 'docs: update README'],
    });
    expect(result.success).toBe(true);
    expect(result.data.notes as string).toContain('v1.0.0');
    expect(result.data.notes as string).toContain('dark mode');
  });

  it('generates notes from changelog when prTitles is empty', async () => {
    const result = await agent.run({
      version: 'v0.9.0',
      changelog: '- Fixed something\n- Added something',
    });
    expect(result.success).toBe(true);
    expect(result.data.notes as string).toContain('v0.9.0');
    expect(result.data.notes as string).toContain('Fixed something');
  });

  it('falls back gracefully with no input', async () => {
    const result = await agent.run({});
    expect(result.success).toBe(true);
    expect(result.data.notes as string).toContain('No changes recorded');
  });

  it('categorises feature PRs correctly', async () => {
    const result = await agent.run({
      version: 'v2.0.0',
      prTitles: ['feat: new onboarding flow'],
    });
    expect(result.data.notes as string).toContain('Features');
  });
});
