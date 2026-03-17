import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import * as fs from "fs/promises";

describe("save_plan.ts CLI", () => {
  const planData = {
    proposal: "Test proposal",
    specs: "Test specs",
    design: "Test design",
    tasks: [{ id: "1", description: "Test task", status: "todo" }],
  };

  it("should save the plan when valid JSON is piped via stdin", async () => {
    // Run the script as a child process
    const result = spawnSync("npx", ["tsx", ".claude-plugin/save_plan.ts"], {
      input: JSON.stringify(planData),
      encoding: "utf-8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Plan saved successfully");

    // Read the saved file to verify
    const fileContent = await fs.readFile("cli-use/changes/latest/plan.json", "utf-8");
    const savedPlan = JSON.parse(fileContent);
    expect(savedPlan).toEqual(planData);
  });

  it("should fail with invalid JSON payload", () => {
    const invalidData = {
      proposal: "Test proposal",
      // Missing specs, design, tasks
    };

    const result = spawnSync("npx", ["tsx", ".claude-plugin/save_plan.ts"], {
      input: JSON.stringify(invalidData),
      encoding: "utf-8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Failed to parse or save plan");
  });

  it("should fail when no payload is provided", () => {
    const result = spawnSync("npx", ["tsx", ".claude-plugin/save_plan.ts"], {
      input: "",
      encoding: "utf-8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("No JSON payload provided via stdin");
  });
});
