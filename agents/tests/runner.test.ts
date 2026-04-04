import { PolicyEvaluator } from '../src/policy';
import { AgentRunner } from '../src/runner';
import { registry } from '../src/registry';

describe('PolicyEvaluator', () => {
  const policy = new PolicyEvaluator();

  it('allows read actions', () => {
    const decision = policy.evaluate('read', {});
    expect(decision.verdict).toBe('PASS');
  });

  it('blocks write actions', () => {
    const decision = policy.evaluate('write', {});
    expect(decision.verdict).toBe('BLOCK');
  });

  it('assertPass does not throw for read', () => {
    expect(() => policy.assertPass('read', {})).not.toThrow();
  });

  it('assertPass throws for write', () => {
    expect(() => policy.assertPass('write', {})).toThrow(/BLOCK/i);
  });
});

describe('AgentRunner', () => {
  const runner = new AgentRunner(registry);

  it('lists all registered agents', () => {
    const list = runner.list();
    expect(list.map((a) => a.name)).toEqual(
      expect.arrayContaining(['FeatureSuggestionAgent', 'QACheckAgent', 'ReleaseNotesAgent']),
    );
  });

  it('throws for unknown agent', async () => {
    await expect(runner.run('UnknownAgent', {})).rejects.toThrow(/not found/i);
  });

  it('runs FeatureSuggestionAgent', async () => {
    const result = await runner.run('FeatureSuggestionAgent', { feedback: ['Need offline mode'] });
    expect(result.success).toBe(true);
  });

  it('runs ReleaseNotesAgent', async () => {
    const result = await runner.run('ReleaseNotesAgent', {
      version: 'v1.0.0',
      prTitles: ['feat: launch'],
    });
    expect(result.success).toBe(true);
  });
});
