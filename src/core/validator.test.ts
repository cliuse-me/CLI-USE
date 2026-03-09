import { describe, it, expect } from 'vitest';
import { validateCode } from './validator';

describe('validateCode', () => {
  it('returns true for clean code', () => {
    expect(validateCode('const a = 1;')).toBe(true);
  });
  it('returns false when console.log is present', () => {
    expect(validateCode('console.log("debug");')).toBe(false);
  });
});
