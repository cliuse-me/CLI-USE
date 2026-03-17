import fs from "fs-extra";
import * as path from "path";
import * as os from "os";

export interface PromptLogEntry {
  timestamp: string;
  command: string;
  prompt: string;
}

export interface CliUseConfig {
  savedPromptsPath?: string;
}

function getConfigPaths() {
  const configDirPath = path.join(os.homedir(), ".opencode");
  const configFilePath = path.join(configDirPath, "cli-use-config.json");
  return { configDirPath, configFilePath };
}

/**
 * Gets the save path for prompts from the config file.
 * If not set, it throws an error to instruct the user to configure it.
 */
export async function getSavePath(): Promise<string> {
  const { configFilePath } = getConfigPaths();
  let config: CliUseConfig = {};
  try {
    if (await fs.pathExists(configFilePath)) {
      config = await fs.readJson(configFilePath);
    }
  } catch (error) {
    console.error("Failed to read config file:", error);
  }

  if (config.savedPromptsPath) {
    return config.savedPromptsPath;
  }

  throw new Error("NOT_CONFIGURED");
}

/**
 * Saves a path preference to the global config.
 * @param savePath - The path where the user wants to save prompts
 */
export async function setSavePath(savePath: string): Promise<string> {
  const { configDirPath, configFilePath } = getConfigPaths();

  // Resolve tilde (~) if the user provided it
  const resolvedPath = savePath.startsWith("~/")
    ? path.join(os.homedir(), savePath.slice(2))
    : path.resolve(savePath);

  let config: CliUseConfig = {};
  if (await fs.pathExists(configFilePath)) {
    try {
      config = await fs.readJson(configFilePath);
    } catch {
      // ignore
    }
  }

  config.savedPromptsPath = resolvedPath;
  
  await fs.ensureDir(configDirPath);
  await fs.outputJson(configFilePath, config, { spaces: 2 });

  return resolvedPath;
}

/**
 * Saves a prompt to a local JSON file in the configured directory.
 * @param command - The command that was executed (e.g., 'save')
 * @param prompt - The actual text provided by the user
 */
export async function savePromptToFile(command: string, prompt: string): Promise<string> {
  const filePath = await getSavePath();
  const dirPath = path.dirname(filePath);

  const entry: PromptLogEntry = {
    timestamp: new Date().toISOString(),
    command,
    prompt,
  };

  await fs.ensureDir(dirPath);

  let existingData: PromptLogEntry[] = [];
  try {
    if (await fs.pathExists(filePath)) {
      const fileContent = await fs.readJson(filePath);
      if (Array.isArray(fileContent)) {
        existingData = fileContent;
      }
    }
  } catch (error) {
    console.error("Failed to read existing prompts file:", error);
  }

  existingData.push(entry);

  await fs.outputJson(filePath, existingData, { spaces: 2 });
  return filePath;
}
