import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';

describe('Claude Code Commands', () => {
  it('has propose.md and implement.md in the correct directory', () => {
    expect(fs.existsSync('.claude-plugin/commands/propose.md')).toBe(true);
    expect(fs.existsSync('.claude-plugin/commands/implement.md')).toBe(true);
  });

  it('has planner.md and implementer.md with correct constraints', () => {
    const planner = fs.readFileSync('.claude-plugin/agents/planner.md', 'utf-8');
    expect(planner).toContain('MUST NOT write implementation code');
    const implementer = fs.readFileSync('.claude-plugin/agents/implementer.md', 'utf-8');
    expect(implementer).toContain('MUST read the .planning/db.json file');
  });
});
