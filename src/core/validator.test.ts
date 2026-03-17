import { describe, it, expect } from "vitest";
import { validateCode } from "./validator";
describe("validateCode", () => {
  it("returns true for clean code", () => {
    expect(validateCode("const x = 1;")).toBe(true);
  });
  it("returns false for code with console.log", () => {
    expect(validateCode('console.log("bad");')).toBe(false);
  });
});
