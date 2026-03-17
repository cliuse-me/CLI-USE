import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cliPath = path.resolve(__dirname, "../dist/cli.js");

describe("CLI commands", () => {
  const testDir = path.resolve(__dirname, "../.test-cli-dir");

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it("should print usage and fail if no arguments are provided", async () => {
    try {
      await execAsync(`node ${cliPath}`, { cwd: testDir });
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe(1);
      expect(err.stderr).toContain("Usage: npx cli-use-core <init|remove> <opencode|claude|all>");
    }
  });

  describe("init", () => {
    it("should setup opencode environment correctly", async () => {
      const { stdout } = await execAsync(`node ${cliPath} init opencode`, { cwd: testDir });
      expect(stdout).toContain("Created opencode-plugin.ts");
      expect(stdout).toContain("Updated .opencode/opencode.json with plugin path.");

      const pluginExists = await fs.pathExists(path.join(testDir, "opencode-plugin.ts"));
      expect(pluginExists).toBe(true);

      const jsonExists = await fs.pathExists(path.join(testDir, ".opencode", "opencode.json"));
      expect(jsonExists).toBe(true);

      const jsonContent = await fs.readJson(path.join(testDir, ".opencode", "opencode.json"));
      expect(jsonContent.plugin).toContain("../opencode-plugin.ts");
    });

    it("should not overwrite existing opencode-plugin.ts", async () => {
      await fs.writeFile(path.join(testDir, "opencode-plugin.ts"), "custom content");

      const { stdout } = await execAsync(`node ${cliPath} init opencode`, { cwd: testDir });
      expect(stdout).toContain("opencode-plugin.ts already exists. Skipping creation.");

      const content = await fs.readFile(path.join(testDir, "opencode-plugin.ts"), "utf-8");
      expect(content).toBe("custom content");
    });

    it("should copy .claude-plugin directory for claude setup", async () => {
      const { stdout } = await execAsync(`node ${cliPath} init claude`, { cwd: testDir });
      expect(stdout).toContain("Copied .claude-plugin directory to your project.");

      const pluginDirExists = await fs.pathExists(path.join(testDir, ".claude-plugin"));
      expect(pluginDirExists).toBe(true);

      const someFileExists = await fs.pathExists(
        path.join(testDir, ".claude-plugin", "claude.json"),
      );
      expect(someFileExists).toBe(true);

      const hooksContent = await fs.readJson(path.join(testDir, ".claude-plugin", "hooks.json"));
      expect(hooksContent.PreToolUse.Edit).toContain("node_modules/cli-use-core");
    });

    it("should setup all environments when 'all' is passed", async () => {
      const { stdout } = await execAsync(`node ${cliPath} init all`, { cwd: testDir });
      expect(stdout).toContain("Created opencode-plugin.ts");
      expect(stdout).toContain("Copied .claude-plugin directory to your project.");

      expect(await fs.pathExists(path.join(testDir, "opencode-plugin.ts"))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, ".claude-plugin"))).toBe(true);
    });
  });

  describe("remove", () => {
    it("should remove opencode environment", async () => {
      // Setup first
      await execAsync(`node ${cliPath} init opencode`, { cwd: testDir });

      const { stdout } = await execAsync(`node ${cliPath} remove opencode`, { cwd: testDir });
      expect(stdout).toContain("Removed opencode-plugin.ts");
      expect(stdout).toContain("Removed plugin entry from .opencode/opencode.json.");

      const pluginExists = await fs.pathExists(path.join(testDir, "opencode-plugin.ts"));
      expect(pluginExists).toBe(false);

      const jsonContent = await fs.readJson(path.join(testDir, ".opencode", "opencode.json"));
      expect(jsonContent.plugin).not.toContain("../opencode-plugin.ts");
    });

    it("should remove claude environment", async () => {
      // Setup first
      await execAsync(`node ${cliPath} init claude`, { cwd: testDir });

      const { stdout } = await execAsync(`node ${cliPath} remove claude`, { cwd: testDir });
      expect(stdout).toContain("Removed .claude-plugin directory from your project.");

      const pluginDirExists = await fs.pathExists(path.join(testDir, ".claude-plugin"));
      expect(pluginDirExists).toBe(false);
    });

    it("should remove all environments when 'all' is passed", async () => {
      await execAsync(`node ${cliPath} init all`, { cwd: testDir });

      const { stdout } = await execAsync(`node ${cliPath} remove all`, { cwd: testDir });
      expect(stdout).toContain("Removed opencode-plugin.ts");
      expect(stdout).toContain("Removed .claude-plugin directory from your project.");

      expect(await fs.pathExists(path.join(testDir, "opencode-plugin.ts"))).toBe(false);
      expect(await fs.pathExists(path.join(testDir, ".claude-plugin"))).toBe(false);
    });
  });
});
