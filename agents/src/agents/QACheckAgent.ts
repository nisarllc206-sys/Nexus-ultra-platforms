import { execSync } from 'child_process';
import { IAgent, AgentInput, AgentResult } from '../IAgent';

/**
 * QACheckAgent
 *
 * Runs the configured lint and test commands in a target directory and reports
 * the results. Read-only: it executes existing toolchain commands but does not
 * write code or modify any files.
 *
 * Input:
 *  - cwd (string): working directory to run commands in (default: process.cwd())
 *  - lintCommand (string): command to run for linting (default: "npm run lint")
 *  - testCommand (string): command to run for tests (default: "npm test")
 */
export class QACheckAgent implements IAgent {
  readonly name = 'QACheckAgent';
  readonly description = 'Runs lint and test commands and reports pass/fail results.';
  readonly inputSchema = {
    cwd: 'Working directory for the commands (default: current working directory)',
    lintCommand: 'Shell command to run for linting (default: "npm run lint")',
    testCommand: 'Shell command to run for tests (default: "npm test")',
  };

  async run(input: AgentInput): Promise<AgentResult> {
    const cwd = typeof input.cwd === 'string' ? input.cwd : process.cwd();
    const lintCmd = typeof input.lintCommand === 'string' ? input.lintCommand : 'npm run lint';
    const testCmd = typeof input.testCommand === 'string' ? input.testCommand : 'npm test';

    const results: Array<{ command: string; passed: boolean; output: string }> = [];

    for (const cmd of [lintCmd, testCmd]) {
      try {
        const output = execSync(cmd, { cwd, encoding: 'utf8', stdio: 'pipe', timeout: 120_000 });
        results.push({ command: cmd, passed: true, output: output.trim() });
      } catch (err: unknown) {
        const execErr = err as { stdout?: string; stderr?: string; message?: string };
        const output = [execErr.stdout, execErr.stderr, execErr.message]
          .filter(Boolean)
          .join('\n')
          .trim();
        results.push({ command: cmd, passed: false, output });
      }
    }

    const allPassed = results.every((r) => r.passed);
    const failedCommands = results.filter((r) => !r.passed).map((r) => r.command);

    return {
      success: allPassed,
      summary: allPassed
        ? 'All QA checks passed.'
        : `QA checks failed for: ${failedCommands.join(', ')}`,
      data: { cwd, results },
    };
  }
}
