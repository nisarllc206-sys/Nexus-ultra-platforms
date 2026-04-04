import { IAgent, AgentInput, AgentResult } from './IAgent';
import { defaultPolicy } from './policy';

/**
 * Registry maps agent names → agent instances.
 */
export type AgentRegistry = Map<string, IAgent>;

/**
 * Runs agents from a registry, applying the policy gate before every execution.
 */
export class AgentRunner {
  constructor(private readonly registry: AgentRegistry) {}

  /**
   * Run a named agent with the given input.
   * Throws if the agent is not found or the policy blocks the action.
   */
  async run(agentName: string, input: AgentInput): Promise<AgentResult> {
    const agent = this.registry.get(agentName);
    if (!agent) {
      const available = Array.from(this.registry.keys()).join(', ');
      throw new Error(
        `Agent "${agentName}" not found. Available agents: ${available || '(none)'}`,
      );
    }

    // All agents in this scaffold perform read-only actions.
    defaultPolicy.assertPass('read', input);

    return agent.run(input);
  }

  /** List all registered agents with their descriptions. */
  list(): Array<{ name: string; description: string; inputSchema: Record<string, string> }> {
    return Array.from(this.registry.values()).map((a) => ({
      name: a.name,
      description: a.description,
      inputSchema: a.inputSchema,
    }));
  }
}
