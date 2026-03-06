import { Plugin, tool } from "@opencode-ai/plugin";
import { z } from "zod";
import { AIEngine } from "./ai/engine";
import { clarifyGoal, generateSpec, generateTddPlan } from "./ai/index";
import { getDb } from "./db";

export const cliUseTddPlugin: Plugin = async (_ctx) => {
  return {
    tool: {
      generate_tdd_plan: tool({
        description:
          "Generates a detailed Test-Driven Development architecture plan for a given goal.",
        args: {
          goal: z.string().describe("The user's goal or feature request"),
        },
        execute: async (args, context) => {
          try {
            const geminiKey = process.env.GEMINI_API_KEY;

            const engine = new AIEngine(
              {
                generate: async (_prompt: string) => {
                  return { text: "CLEAR" };
                },
              },
              { gemini: geminiKey },
            );

            const constitution = "Strictly adhere to Test-Driven Development.";
            const goal = args.goal as string;

            context.metadata({ title: "Clarifying goal..." });
            const clarification = await clarifyGoal(goal, engine);
            console.error("Goal Clarification Output:", clarification); // Background logging

            context.metadata({ title: "Generating Spec..." });
            const spec = await generateSpec(goal, constitution, engine);

            context.metadata({ title: "Generating TDD Plan..." });
            const plan = await generateTddPlan(spec, constitution, engine);

            // Save to database
            const db = await getDb();
            db.data.goal = goal;
            db.data.spec = spec as any;
            db.data.plan = plan as any;
            db.data.status = "done";
            await db.write();

            return "Successfully generated TDD plan. Please read .planning/db.json and wait for the user.";
          } catch (error) {
            console.error("Failed to generate TDD plan via plugin:", error);
            return `Failed to generate TDD plan: ${error instanceof Error ? error.message : String(error)}`;
          }
        },
      }),
    },
  };
};
