import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { savePromptToFile, PromptLogEntry } from "./prompt-storage.js";

// Mock the file system
vi.mock("fs/promises");
vi.mock("os");

describe("savePromptToFile", () => {
  const MOCK_HOME_DIR = "/mock/home";
  const expectedDirPath = path.join(MOCK_HOME_DIR, ".opencode");
  const expectedFilePath = path.join(expectedDirPath, "saved-prompts.json");

  beforeEach(() => {
    vi.mocked(os.homedir).mockReturnValue(MOCK_HOME_DIR);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create a new file if one doesn't exist", async () => {
    // Simulate file not existing
    const error: any = new Error("File not found");
    error.code = "ENOENT";
    vi.mocked(fs.readFile).mockRejectedValue(error);

    await savePromptToFile("save", "test prompt");

    expect(fs.mkdir).toHaveBeenCalledWith(expectedDirPath, { recursive: true });
    
    // Verify the write
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    const writeArgs = vi.mocked(fs.writeFile).mock.calls[0];
    expect(writeArgs[0]).toBe(expectedFilePath);
    
    // Parse the JSON that was written
    const writtenData = JSON.parse(writeArgs[1] as string) as PromptLogEntry[];
    expect(writtenData).toHaveLength(1);
    expect(writtenData[0].command).toBe("save");
    expect(writtenData[0].prompt).toBe("test prompt");
    expect(writtenData[0].timestamp).toBeDefined();
  });

  it("should append to an existing file", async () => {
    // Simulate an existing file with one prompt
    const existingPrompts: PromptLogEntry[] = [
      { timestamp: "2024-01-01T00:00:00.000Z", command: "save", prompt: "first prompt" }
    ];
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingPrompts));

    await savePromptToFile("save", "second prompt");

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    const writeArgs = vi.mocked(fs.writeFile).mock.calls[0];
    
    // Parse the JSON that was written
    const writtenData = JSON.parse(writeArgs[1] as string) as PromptLogEntry[];
    expect(writtenData).toHaveLength(2);
    expect(writtenData[0].prompt).toBe("first prompt");
    expect(writtenData[1].prompt).toBe("second prompt");
  });
});
