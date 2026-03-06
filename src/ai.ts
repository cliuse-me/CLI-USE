import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ModelConfig } from "./lib/models";
import { SpecSchema, PlanSchema } from "./db";

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "",
});

export async function generateSpec(goal: string, _config: ModelConfig) {
  const model = google("gemini-2.0-flash");

  const { output: object } = await generateText({
    model,
    output: Output.object({ schema: SpecSchema }),
    prompt: `You are an expert Product Manager. Create a detailed product specification for the following goal: "${goal}".`,
  });

  return object;
}

export async function generateTddPlan(spec: any, _config: ModelConfig) {
  const model = google("gemini-2.0-flash");

  const { output: object } = await generateText({
    model,
    output: Output.object({ schema: PlanSchema }),
    prompt: `You are an expert Software Architect strict about Test-Driven Development (TDD).
             Given this specification: ${JSON.stringify(spec)}
             Create a test plan containing the unit tests that must be written first, followed by the implementation steps.`,
  });

  return object;
}
