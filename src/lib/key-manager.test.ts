import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as dotenv from "dotenv";

vi.mock("dotenv", () => ({
  default: {
    config: vi.fn(),
  },
}));

describe("KeyManager", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should split comma-separated keys and return them in round-robin order", async () => {
    process.env.GOOGLE_API_KEYS = "key1, key2, key3";
    const { keyManager } = await import("./key-manager");

    expect(keyManager.hasKeys()).toBe(true);
    expect(keyManager.getNextKey()).toBe("key1");
    expect(keyManager.getNextKey()).toBe("key2");
    expect(keyManager.getNextKey()).toBe("key3");
    expect(keyManager.getNextKey()).toBe("key1");
  });

  it("should handle missing keys gracefully", async () => {
    delete process.env.GOOGLE_API_KEYS;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const { keyManager } = await import("./key-manager");

    expect(keyManager.hasKeys()).toBe(false);
    expect(keyManager.getNextKey()).toBe("");
  });
});
