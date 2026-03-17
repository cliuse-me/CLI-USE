import * as fs from "fs/promises";

/**
 * Re-defining the structure here to ensure type safety when loading state.
 */
export interface PlanSchema {
  proposal: string;
  specs: string;
  design: string;
  tasks: any[];
}

/**
 * Headless function to retrieve the existing plan state from the file system.
 * This satisfies the "State Management Constraint" where we avoid global variables
 * in memory, and rely solely on the `.json` file acting as the absolute source of truth.
 *
 * @param featureName - The name/ID of the feature to load.
 * @returns The parsed PlanSchema object, or null if the file hasn't been created yet.
 */
export async function getPlanState(featureName: string): Promise<PlanSchema | null> {
  try {
    const data = await fs.readFile(`cli-use/changes/${featureName}/plan.json`, "utf-8");
    return JSON.parse(data) as PlanSchema;
  } catch (error: any) {
    // Gracefully handle missing files (ENOENT) returning null instead of throwing
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
