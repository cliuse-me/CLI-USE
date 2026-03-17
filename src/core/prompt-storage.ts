import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export interface PromptLogEntry {
  timestamp: string;
  command: string;
  prompt: string;
}

/**
 * Saves a prompt to a local JSON file in the user's home directory.
 * @param command - The command that was executed (e.g., 'save')
 * @param prompt - The actual text provided by the user
 */
export async function savePromptToFile(command: string, prompt: string): Promise<void> {
  // Use a dotfolder in the user's home directory to store saved prompts across projects
  const dirPath = path.join(os.homedir(), ".opencode");
  const filePath = path.join(dirPath, "saved-prompts.json");

  const entry: PromptLogEntry = {
    timestamp: new Date().toISOString(),
    command,
    prompt,
  };

  await fs.mkdir(dirPath, { recursive: true });

  let existingData: PromptLogEntry[] = [];
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    existingData = JSON.parse(fileContent);
    if (!Array.isArray(existingData)) {
       existingData = [];
    }
  } catch (error: any) {
    // If the file doesn't exist or is invalid JSON, we'll just start with an empty array
    if (error.code !== "ENOENT") {
        console.error("Failed to read existing prompts file:", error);
    }
  }

  existingData.push(entry);

  await fs.writeFile(filePath, JSON.stringify(existingData, null, 2), "utf-8");
}
