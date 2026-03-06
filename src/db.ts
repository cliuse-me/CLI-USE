import { JSONFilePreset } from "lowdb/node";
import { z } from "zod";
import fs from "fs-extra";
import { SpecSchema, TddPlanSchema } from "./db/schemas";

// --- STATE INTERFACE ---
export interface AppState {
  goal: string;
  status: "idle" | "spec" | "plan" | "done";
  spec: z.infer<typeof SpecSchema> | null;
  plan: z.infer<typeof TddPlanSchema> | null;
}

// --- INIT DB ---
const defaultData: AppState = {
  goal: "",
  status: "idle",
  spec: null,
  plan: null,
};

export const getDb = async () => {
  await fs.ensureDir(".planning");
  // Saves to .planning/db.json automatically
  return await JSONFilePreset<AppState>(".planning/db.json", defaultData);
};

export { SpecSchema, TddPlanSchema };
