import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';

describe('NPM Package Metadata', () => {
  it('has correct name and no bin field', async () => {
    const pkg = await fs.readJson('package.json');
    expect(pkg.name).toBe('cli-use-core');
    expect(pkg.bin).toBeUndefined();
    expect(pkg.repository.url).toBe('git+https://github.com/cliuse-me/CLI-USE.git');
  });

  it('has correct files whitelist', async () => {
    const pkg = await fs.readJson('package.json');
    expect(pkg.files).toContain('dist');
    expect(pkg.files).toContain('.claude-plugin');
  });

  it('compiles validate script and uses it in hooks', async () => {
    const pkg = await fs.readJson('package.json');
    expect(pkg.scripts.build).toContain('tsup');
    const tsupConfig = await fs.readFile('tsup.config.ts', 'utf-8');
    expect(tsupConfig).toContain('bin/claude-validate.ts');
    const hooks = await fs.readJson('.claude-plugin/hooks.json');
    expect(hooks.PreToolUse.Edit).toContain('node dist/claude-validate.js');
  });

  it('has manual release automation configured', async () => {
    const pkg = await fs.readJson('package.json');
    expect(pkg.scripts.release).toBe('node run-release.js');
    expect(pkg.scripts.prepublishOnly).toContain('npm run build');
  });
});
