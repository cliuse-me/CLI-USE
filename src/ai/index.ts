import { AIEngine } from "./engine";
import { SpecSchema, TddPlanSchema } from "../db/schemas";
import { z } from "zod";

export async function clarifyGoal(goal: string, engine: AIEngine): Promise<string> {
  const prompt = `Please review the following goal. Return exactly 1 clarifying question if ambiguous, or output "CLEAR" if it is fully actionable.\n\nGoal: ${goal}`;
  return engine.chat(prompt);
}

export async function generateSpec(
  goal: string,
  constitution: string,
  engine: AIEngine,
): Promise<z.infer<typeof SpecSchema>> {
  const prompt = `Constitution: ${constitution}\n\nGoal: ${goal}\n\nGenerate a detailed product specification.`;
  return engine.generateStructured<z.infer<typeof SpecSchema>>(prompt, SpecSchema);
}

export async function generateTddPlan(
  spec: any,
  constitution: string,
  engine: AIEngine,
): Promise<z.infer<typeof TddPlanSchema>> {
  const prompt = `Constitution: ${constitution}\n\nSpecification: ${JSON.stringify(spec)}\n\nGenerate a strict TDD Architecture plan identifying tests to write before implementation.`;
  return engine.generateStructured<z.infer<typeof TddPlanSchema>>(prompt, TddPlanSchema);
}
