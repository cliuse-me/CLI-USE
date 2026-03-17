import { savePlan } from "../src/core/db.js";
import { z } from "zod";

/**
 * Zod schema defining the exact structure expected for the TDD architecture plan.
 * Used to rigidly validate the AI's JSON output before it's allowed to be saved.
 */
const planSchema = z.object({
  proposal: z.string(),
  specs: z.string(),
  design: z.string(),
  tasks: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      status: z.string(),
    }),
  ),
});

/**
 * The main adapter entry point for the Claude Code CLI tool execution.
 *
 * Enforces the "Stdin Protocol" (Shell Injection Immunity Constraint):
 * Instead of accepting LLM arguments via command-line parameters (which could
 * result in malicious command injections), this reads the raw JSON payload
 * exclusively from standard input.
 */
async function main() {
  const chunks: Buffer[] = [];

  // 1. Asynchronously read and collect all data piped into stdin
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  const payloadStr = Buffer.concat(chunks).toString("utf-8").trim();

  if (!payloadStr) {
    console.error("No JSON payload provided via stdin");
    process.exit(1);
  }

  try {
    // 2. Parse and Validate the collected JSON payload
    const data = JSON.parse(payloadStr);
    const plan = planSchema.parse(data);

    // 3. Delegate to the headless core logic to handle the actual persistence
    // Using "latest" to match OpenCode plugin and simplify implementer's job
    await savePlan("latest", plan);
    console.log("Plan saved successfully to cli-use/changes/latest/plan.json.");
  } catch (err: any) {
    console.error("Failed to parse or save plan:", err.message);
    process.exit(1);
  }
}

main();
