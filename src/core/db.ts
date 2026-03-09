import * as fs from 'fs/promises';

/**
 * Defines the structure of the TDD architecture plan.
 * This schema guarantees a consistent format across different agents and environments.
 */
export interface PlanSchema {
  proposal?: string;
  specs?: string;
  design?: string;
  tasks?: any[];
}

/**
 * Headless function to persist a generated plan to the local file system.
 * By strictly using `fs/promises`, this core logic remains completely isolated
 * from specific platform APIs or AI SDKs, enforcing the "Universal Core Constraint".
 * 
 * @param featureName - The name/ID of the feature. Defaults to "latest" in most cases.
 * @param payload - The structured JSON plan to be saved.
 */
export async function savePlan(featureName: string, payload: PlanSchema): Promise<void> {
  const dirPath = `cli-use/changes/${featureName}`;
  const filePath = `${dirPath}/plan.json`;

  // Ensure the directory structure exists before writing the file
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
}
