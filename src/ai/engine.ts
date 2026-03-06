import { z } from "zod";
import { extractAndParseJSON } from "../utils/json-repair";

export interface AgnosticLlm {
  generate(prompt: string): Promise<{ text: string }>;
}

export class AIEngine {
  constructor(
    private agnosticLlm: AgnosticLlm,
    private keys: { gemini?: string },
  ) {}

  async chat(prompt: string): Promise<string> {
    try {
      const response = await this.agnosticLlm.generate(prompt);
      return response.text;
    } catch (error) {
      console.error("Agnostic LLM chat error:", error);
      throw error;
    }
  }

  async generateStructured<T>(prompt: string, schema: z.ZodType<any>): Promise<T> {
    if (this.keys.gemini) {
      try {
        const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
        const { generateObject } = await import("ai");

        const google = createGoogleGenerativeAI({ apiKey: this.keys.gemini });

        const { object } = await generateObject({
          model: google("gemini-2.0-flash"),
          schema,
          prompt,
        });

        return object as T;
      } catch (error) {
        console.error("Vercel AI SDK Structured Generation Error:", error);
        throw error;
      }
    }

    // Agnostic Fallback
    try {
      const strictPrompt = `${prompt}\n\nCRITICAL: Output ONLY raw valid JSON matching the schema.`;
      const rawText = await this.chat(strictPrompt);
      const parsedJSON = extractAndParseJSON(rawText);

      // Validates and strips extra fields
      return schema.parse(parsedJSON) as T;
    } catch (error) {
      console.error("Agnostic fallback parsing/validation error:", error);
      throw error;
    }
  }
}
