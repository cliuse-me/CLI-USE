import { spawnSync } from 'child_process';
import process from 'process';

console.log("Preparing for manual publish workflow...");
console.log("Running prepublish scripts (build, typecheck, test)...");

const prepublish = spawnSync('npm', ['run', 'prepublishOnly'], { stdio: 'inherit' });
if (prepublish.status !== 0) {
  console.error("Prepublish scripts failed. Aborting.");
  process.exit(1);
}

console.log("Scripts passed. Bumping patch version...");
const version = spawnSync('npm', ['version', 'patch'], { stdio: 'inherit' });
if (version.status !== 0) {
  console.error("Version bump failed. Aborting.");
  process.exit(1);
}

console.log("Publishing to npm...");
const publish = spawnSync('npm', ['publish'], { stdio: 'inherit' });
if (publish.status !== 0) {
  console.error("Publish failed.");
  process.exit(1);
}

console.log("Pushing git tags to remote...");
spawnSync('git', ['push', '--follow-tags'], { stdio: 'inherit' });

console.log("Release complete!");
