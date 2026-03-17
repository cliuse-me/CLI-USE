import { spawnSync } from 'child_process';
import process from 'process';

console.log("Preparing for manual publish workflow...");
console.log("Running prepublish scripts (build, typecheck, test)...");

const prepublish = spawnSync('npm', ['run', 'prepublishOnly'], { stdio: 'inherit' });
if (prepublish.status !== 0) {
  console.error("Prepublish scripts failed. Aborting.");
  process.exit(1);
}

// We already bumped the version locally, so we don't need to do it again unless requested.
// This handles retrying a failed publish.

console.log("Publishing to npm...");
// Run npm publish directly so the user can be prompted for 2FA
const publish = spawnSync('npm', ['publish'], { stdio: 'inherit' });
if (publish.status !== 0) {
  console.error("Publish failed.");
  process.exit(1);
}

console.log("Pushing git tags to remote...");
spawnSync('git', ['push', '--follow-tags'], { stdio: 'inherit' });

console.log("Release complete!");
