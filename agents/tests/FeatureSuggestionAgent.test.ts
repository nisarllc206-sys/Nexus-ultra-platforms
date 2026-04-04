import { FeatureSuggestionAgent } from '../src/agents/FeatureSuggestionAgent';

describe('FeatureSuggestionAgent', () => {
  const agent = new FeatureSuggestionAgent();

  it('has correct name and description', () => {
    expect(agent.name).toBe('FeatureSuggestionAgent');
    expect(typeof agent.description).toBe('string');
  });

  it('returns success with no input', async () => {
    const result = await agent.run({});
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data.suggestions)).toBe(true);
  });

  it('detects dark mode keyword in feedback', async () => {
    const result = await agent.run({ feedback: ['I want dark mode please'] });
    expect(result.success).toBe(true);
    const suggestions = result.data.suggestions as string[];
    expect(suggestions.some((s) => /dark mode/i.test(s))).toBe(true);
  });

  it('flags high-frequency event types', async () => {
    const events = [
      { type: 'crash', payload: {} },
      { type: 'crash', payload: {} },
      { type: 'crash', payload: {} },
    ];
    const result = await agent.run({ events });
    const suggestions = result.data.suggestions as string[];
    expect(suggestions.some((s) => s.includes('crash'))).toBe(true);
  });

  it('handles string feedback array', async () => {
    const result = await agent.run({ feedback: ['app is slow', 'need offline support'] });
    const suggestions = result.data.suggestions as string[];
    expect(suggestions.length).toBeGreaterThan(0);
  });
});
