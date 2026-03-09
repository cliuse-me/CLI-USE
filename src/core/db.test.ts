import { describe, it, expect, vi } from 'vitest';
import { savePlan } from './db';
import * as fs from 'fs/promises';

vi.mock('fs/promises');

describe('savePlan', () => {
  it('writes valid payload to correct path', async () => {
    const payload = { proposal: 'a', specs: 'b', design: 'c', tasks: [] };
    await savePlan('test-feature', payload as any);
    expect(fs.mkdir).toHaveBeenCalledWith('cli-use/changes/test-feature', { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      'cli-use/changes/test-feature/plan.json',
      JSON.stringify(payload, null, 2),
      'utf-8'
    );
  });
});
