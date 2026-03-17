import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "opencode-plugin": "src/opencode-plugin.ts",
    "claude-validate": "bin/claude-validate.ts",
    cli: "bin/cli.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
});
