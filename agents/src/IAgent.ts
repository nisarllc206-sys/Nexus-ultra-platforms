/** The input passed to an agent's run() method. */
export type AgentInput = Record<string, unknown>;

/** The result returned by an agent's run() method. */
export interface AgentResult {
  /** Whether the agent succeeded. */
  success: boolean;
  /** Human-readable summary of what the agent did. */
  summary: string;
  /** Structured output data produced by the agent. */
  data: Record<string, unknown>;
}

/**
 * All agents must implement this interface.
 * Agents are read-only in the current scaffold: they may read data and produce
 * suggestions/reports, but they must NOT write to external systems.
 */
export interface IAgent {
  /** Unique machine-readable name (PascalCase). */
  readonly name: string;
  /** Short human-readable description. */
  readonly description: string;
  /**
   * JSON Schema–style description of required inputs.
   * Key = field name, value = description string.
   */
  readonly inputSchema: Record<string, string>;
  /** Execute the agent logic and return a result. */
  run(input: AgentInput): Promise<AgentResult>;
}
