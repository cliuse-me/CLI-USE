import { spawnSync } from 'child_process';
import process from 'process';

console.log("Preparing for manual publish workflow...");
console.log("Running prepublish scripts (build, typecheck, test)...");

const npmPath = process.env.npm_execpath || 'npm';
const command = npmPath.endsWith('.js') ? [process.execPath, npmPath] : [npmPath];

const prepublish = spawnSync(command[0], [...command.slice(1), 'run', 'prepublishOnly'], { stdio: 'inherit' });
if (prepublish.status !== 0) {
  console.error("Prepublish scripts failed. Aborting.");
  process.exit(1);
}

// Extract OTP directly from the user's invocation if provided
const args = process.argv.slice(2);
const publishArgs = ['publish'];
if (args.length > 0) {
  publishArgs.push('--otp=' + args[0]);
}

console.log("Publishing to npm...");
const publish = spawnSync(command[0], [...command.slice(1), ...publishArgs], { stdio: 'inherit' });
if (publish.status !== 0) {
  console.error("\nPublish failed. If this is a Two-Factor Authentication (OTP) error, please run the release script with your 6-digit OTP code:");
  console.error("npm run release -- <your-otp-code>");
  console.error("\nExample: npm run release -- 123456");
  process.exit(1);
}

console.log("Pushing git tags to remote...");
spawnSync('git', ['push', '--follow-tags'], { stdio: 'inherit' });

console.log("Release complete!");
