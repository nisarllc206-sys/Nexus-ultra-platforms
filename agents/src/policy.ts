import { AgentInput, AgentResult } from './IAgent';

/**
 * The action type that the policy evaluator considers.
 * In the initial scaffold only "read" actions are allowed.
 */
export type ActionType = 'read' | 'write';

export interface PolicyDecision {
  verdict: 'PASS' | 'BLOCK';
  reason: string;
}

/**
 * Evaluates whether an agent action is permitted.
 *
 * Safety rule: "write" actions are BLOCKED entirely in this initial scaffold.
 * A human must update this policy (and remove this comment) before write
 * actions can be enabled, after thorough review.
 */
export class PolicyEvaluator {
  evaluate(actionType: ActionType, _input: AgentInput): PolicyDecision {
    if (actionType === 'write') {
      return {
        verdict: 'BLOCK',
        reason:
          'Write actions are disabled in this scaffold. ' +
          'A human reviewer must explicitly enable write actions after safety review.',
      };
    }
    return { verdict: 'PASS', reason: 'Read-only actions are permitted.' };
  }

  /** Convenience: throw if action is blocked. */
  assertPass(actionType: ActionType, input: AgentInput): void {
    const decision = this.evaluate(actionType, input);
    if (decision.verdict === 'BLOCK') {
      throw new Error(`PolicyEvaluator BLOCKED action (${actionType}): ${decision.reason}`);
    }
  }
}

/** Singleton evaluator used by the runner. */
export const defaultPolicy = new PolicyEvaluator();

/** Helper: get the result of a read action without throwing. */
export function evaluateRead(_input: AgentInput): PolicyDecision {
  return defaultPolicy.evaluate('read', _input);
}

/** Convenience re-export */
export type { AgentInput, AgentResult };
