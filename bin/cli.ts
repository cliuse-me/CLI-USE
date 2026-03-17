#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const platform = args[1];

  if (!["init", "remove"].includes(command) || !["opencode", "claude", "all"].includes(platform)) {
    console.error("Usage: npx cli-use-core <init|remove> <opencode|claude|all>");
    process.exit(1);
  }

  const cwd = process.cwd();

  if (command === "init") {
    if (platform === "opencode" || platform === "all") {
      // 1. Create opencode-plugin.ts
      const pluginPath = path.join(cwd, "opencode-plugin.ts");
      if (!(await fs.pathExists(pluginPath))) {
        await fs.writeFile(
          pluginPath,
          `import { cliUsePlugin } from "cli-use-core/plugin";\n\nexport default cliUsePlugin;\n`,
          "utf-8",
        );
        console.info("✅ Created opencode-plugin.ts");
      } else {
        console.info("ℹ️ opencode-plugin.ts already exists. Skipping creation.");
      }

      // 2. Manage .opencode/opencode.json
      const opencodeDir = path.join(cwd, ".opencode");
      await fs.ensureDir(opencodeDir);
      const opencodeJsonPath = path.join(opencodeDir, "opencode.json");

      let opencodeJson: any = {
        $schema: "https://opencode.ai/config.json",
        plugin: [],
      };

      if (await fs.pathExists(opencodeJsonPath)) {
        try {
          const content = await fs.readFile(opencodeJsonPath, "utf-8");
          opencodeJson = JSON.parse(content);
        } catch (err) {
          console.error("❌ Failed to parse existing .opencode/opencode.json", err);
          process.exit(1);
        }
      }

      if (!Array.isArray(opencodeJson.plugin)) {
        opencodeJson.plugin = [];
      }

      if (!opencodeJson.plugin.includes("../opencode-plugin.ts")) {
        opencodeJson.plugin.push("../opencode-plugin.ts");
        await fs.writeFile(opencodeJsonPath, JSON.stringify(opencodeJson, null, 2), "utf-8");
        console.info("✅ Updated .opencode/opencode.json with plugin path.");
      } else {
        console.info("ℹ️ .opencode/opencode.json already contains the plugin path.");
      }
    }

    if (platform === "claude" || platform === "all") {
      const packageRoot = path.join(__dirname, "..");
      const sourcePluginDir = path.join(packageRoot, ".claude-plugin");
      const targetPluginDir = path.join(cwd, ".claude-plugin");

      if (await fs.pathExists(sourcePluginDir)) {
        await fs.copy(sourcePluginDir, targetPluginDir, { overwrite: true });

        // Fix the hooks.json path dynamically based on whether it is local or installed globally/via npm
        const hooksPath = path.join(targetPluginDir, "hooks.json");
        if (await fs.pathExists(hooksPath)) {
          const hooks = await fs.readJson(hooksPath);
          // Assume execution from node_modules if no manual dist folder found or we are initializing normally
          if (hooks.PreToolUse) {
            if (hooks.PreToolUse.Edit)
              hooks.PreToolUse.Edit = "npx tsx node_modules/cli-use-core/bin/claude-validate.ts";
            if (hooks.PreToolUse.Write)
              hooks.PreToolUse.Write = "npx tsx node_modules/cli-use-core/bin/claude-validate.ts";
          }
          await fs.writeJson(hooksPath, hooks, { spaces: 2 });
        }

        console.info("✅ Copied .claude-plugin directory to your project.");
      } else {
        console.error(`❌ Could not find .claude-plugin directory at ${sourcePluginDir}`);
        process.exit(1);
      }
    }
  } else if (command === "remove") {
    if (platform === "opencode" || platform === "all") {
      const pluginPath = path.join(cwd, "opencode-plugin.ts");
      if (await fs.pathExists(pluginPath)) {
        await fs.remove(pluginPath);
        console.info("✅ Removed opencode-plugin.ts");
      } else {
        console.info("ℹ️ opencode-plugin.ts not found. Skipping.");
      }

      const opencodeJsonPath = path.join(cwd, ".opencode", "opencode.json");
      if (await fs.pathExists(opencodeJsonPath)) {
        try {
          const content = await fs.readFile(opencodeJsonPath, "utf-8");
          const opencodeJson = JSON.parse(content);

          if (Array.isArray(opencodeJson.plugin)) {
            opencodeJson.plugin = opencodeJson.plugin.filter(
              (p: string) => p !== "../opencode-plugin.ts",
            );
            await fs.writeFile(opencodeJsonPath, JSON.stringify(opencodeJson, null, 2), "utf-8");
            console.info("✅ Removed plugin entry from .opencode/opencode.json.");
          }
        } catch (err) {
          console.error("❌ Failed to update .opencode/opencode.json", err);
        }
      }
    }

    if (platform === "claude" || platform === "all") {
      const targetPluginDir = path.join(cwd, ".claude-plugin");
      if (await fs.pathExists(targetPluginDir)) {
        await fs.remove(targetPluginDir);
        console.info("✅ Removed .claude-plugin directory from your project.");
      } else {
        console.info("ℹ️ .claude-plugin directory not found. Skipping.");
      }
    }
  }
}

main().catch((err) => {
  console.error("❌ An error occurred:", err);
  process.exit(1);
});
