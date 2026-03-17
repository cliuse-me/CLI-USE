import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const testEnvDir = path.join(rootDir, "test-pack-env");

function run(command: string, cwd: string = rootDir) {
  console.info(`\n> ${command}`);
  return execSync(command, { cwd, stdio: "pipe", encoding: "utf-8" });
}

async function main() {
  console.info("🚀 Starting end-to-end package build & pack test...\n");

  // 1. Build the project
  console.info("📦 Building project...");
  execSync("npm run build", { cwd: rootDir, stdio: "inherit" });

  // 2. Pack the tarball
  console.info("\n📦 Packing tarball...");
  const packOutput = run("npm pack --quiet");

  // npm pack --quiet output might have multiple lines if there are warnings, but the last non-empty line is the tarball name
  const lines = packOutput.trim().split("\n").filter(Boolean);
  const tarballName = lines.pop()?.trim();

  if (!tarballName || !tarballName.endsWith(".tgz")) {
    console.error("❌ Failed to determine tarball name from npm pack output:", packOutput);
    process.exit(1);
  }

  const tarballPath = path.join(rootDir, tarballName);
  console.info(`✅ Generated tarball: ${tarballName}`);

  // 3. Create a clean test environment
  console.info(`\n🧹 Cleaning previous test environment at ${testEnvDir}...`);
  await fs.remove(testEnvDir);
  await fs.ensureDir(testEnvDir);

  // 4. Initialize dummy project
  console.info("📄 Initializing dummy package.json...");
  run("npm init -y", testEnvDir);

  // 5. Install the tarball
  console.info(`\n⬇️  Installing local artifact: ${tarballName}...`);
  execSync(`npm install ../${tarballName} --no-save`, { cwd: testEnvDir, stdio: "inherit" });

  // 6. Test CLI execution
  console.info("\n🛠️  Executing npx cli-use-core init all...");
  execSync("npx cli-use-core init all", { cwd: testEnvDir, stdio: "inherit" });

  // 7. Verify outputs exist
  const opencodePluginExists = await fs.pathExists(path.join(testEnvDir, "opencode-plugin.ts"));
  const claudePluginExists = await fs.pathExists(path.join(testEnvDir, ".claude-plugin"));

  if (!opencodePluginExists || !claudePluginExists) {
    console.error("\n❌ E2E verification failed. Some expected artifacts were missing after init.");
    process.exit(1);
  }

  // 8. Test CLI removal
  console.info("\n🛠️  Executing npx cli-use-core remove all...");
  execSync("npx cli-use-core remove all", { cwd: testEnvDir, stdio: "inherit" });

  const opencodePluginRemoved = !(await fs.pathExists(path.join(testEnvDir, "opencode-plugin.ts")));
  const claudePluginRemoved = !(await fs.pathExists(path.join(testEnvDir, ".claude-plugin")));

  if (opencodePluginRemoved && claudePluginRemoved) {
    console.info("\n🎉 SUCCESS: All artifacts installed, verified, and safely removed!");
    console.info(`\n🧪 The test environment is ready for inspection at: test-pack-env/`);
    console.info(`To clean up, you can run:\n  rm -rf test-pack-env ${tarballName}`);
  } else {
    console.error("\n❌ E2E verification failed. Some artifacts were not successfully removed.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n❌ An error occurred during the test pack execution:", err);
  process.exit(1);
});
