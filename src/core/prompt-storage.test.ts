import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import { savePromptToFile, setSavePath, getSavePath, PromptLogEntry } from "./prompt-storage.js";

// Mock the file system
vi.mock("fs-extra", () => ({
  default: {
    pathExists: vi.fn(),
    readJson: vi.fn(),
    ensureDir: vi.fn(),
    outputJson: vi.fn(),
  }
}));
vi.mock("os");

describe("Prompt Storage", () => {
  const MOCK_HOME_DIR = "/mock/home";
  const expectedDirPath = path.join(MOCK_HOME_DIR, ".opencode");
  const expectedConfigPath = path.join(expectedDirPath, "cli-use-config.json");
  const expectedCustomPath = "/custom/path/prompts.json";

  beforeEach(() => {
    vi.mocked(os.homedir).mockReturnValue(MOCK_HOME_DIR);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSavePath", () => {
    it("should throw an error if not configured", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as any);
      
      await expect(getSavePath()).rejects.toThrow("NOT_CONFIGURED");
    });

    it("should return the path if configured", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as any);
      vi.mocked(fs.readJson).mockResolvedValue({ savedPromptsPath: expectedCustomPath });
      
      const p = await getSavePath();
      expect(p).toBe(expectedCustomPath);
    });
  });

  describe("setSavePath", () => {
    it("should resolve tilde and save config", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as any);
      
      const p = await setSavePath("~/my-prompts.json");
      const resolved = path.join(MOCK_HOME_DIR, "my-prompts.json");
      expect(p).toBe(resolved);

      expect(fs.ensureDir).toHaveBeenCalledWith(expectedDirPath);
      expect(fs.outputJson).toHaveBeenCalledWith(expectedConfigPath, { savedPromptsPath: resolved }, { spaces: 2 });
    });
  });

  describe("savePromptToFile", () => {
    it("should append to an existing file when configured", async () => {
      // Config exists and has a path
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (p === expectedConfigPath) return true;
        if (p === expectedCustomPath) return true;
        return false;
      });

      // Mock reading config then reading the prompts file
      vi.mocked(fs.readJson).mockImplementation(async (p) => {
        if (p === expectedConfigPath) return { savedPromptsPath: expectedCustomPath };
        if (p === expectedCustomPath) return [{ timestamp: "2024-01-01T00:00:00.000Z", command: "save", prompt: "first prompt" }];
        return null;
      });

      const savedPath = await savePromptToFile("save", "second prompt");

      expect(savedPath).toBe(expectedCustomPath);
      expect(fs.outputJson).toHaveBeenCalledTimes(1);
      
      const writeArgs = vi.mocked(fs.outputJson).mock.calls[0];
      expect(writeArgs[0]).toBe(expectedCustomPath);
      
      const writtenData = writeArgs[1] as PromptLogEntry[];
      expect(writtenData).toHaveLength(2);
      expect(writtenData[0].prompt).toBe("first prompt");
      expect(writtenData[1].prompt).toBe("second prompt");
    });
  });
});
