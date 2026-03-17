import { Plugin, tool } from "@opencode-ai/plugin";
import { z } from "zod";
import { savePlan } from "./core/db.js";
import { getPlanState } from "./core/state.js";
import { validateCode } from "./core/validator.js";

/**
 * The primary OpenCode Plugin implementation.
 * Bridges the gap between the OpenCode ecosystem hooks and the headless core logic.
 */
export const cliUsePlugin: Plugin = async (_ctx) => {
  return {
    /**
     * `config` hook: Programmatically injects agent personas and custom commands 
     * into the OpenCode CLI, adhering to the "Agent Switching Paradigm".
     */
    config: async (cfg) => {
      cfg.agent = cfg.agent || {};
      
      // 1. Planner Agent: Responsible exclusively for analyzing and designing the plan.
      // Explicitly stripped of file editing capabilities.
      cfg.agent["cli-use-planner"] = {
        description: "An architect/planner that analyzes requirements and designs a plan. Cannot write code.",
        prompt: "You are the CLI Use Planner. Analyze requirements, read files, and design a comprehensive plan. When the plan is ready, save it using the `save_plan` tool. You cannot write code. Do not attempt to modify files directly.",
        permission: {
          edit: "deny" // Deny file-system mutations
        },
        tools: {
          save_plan: true
        }
      };
      
      // 2. Implementer Agent: Responsible for reading the plan and writing the code.
      cfg.agent["cli-use-implementer"] = {
        description: "An implementer agent that writes code based on the saved plan.",
        prompt: "You are the CLI Use Implementer. Read the plan saved by the planner from cli-use/changes/latest/plan.json and implement the code according to the plan."
      };

      cfg.command = cfg.command || {};

      // Command to switch context to the Planner
      cfg.command["propose"] = {
        agent: "cli-use-planner",
        description: "Engage the planner to propose a change and save it to a plan",
        template: "Act as the CLI Use Planner. Analyze the following request and create a detailed plan using the save_plan tool: $ARGUMENTS"
      };

      // Command to switch context to the Implementer
      cfg.command["implement"] = {
        agent: "cli-use-implementer",
        description: "Engage the implementer to write code based on the latest saved plan",
        template: "Act as the CLI Use Implementer. Read the latest plan from cli-use/changes/latest/plan.json and implement it. $ARGUMENTS"
      };
    },

    /**
     * `chat.params` hook: Context Injection Mechanism.
     * Before OpenCode sends the system prompt to the underlying LLM, this hook evaluates
     * if the active agent is the "implementer". If so, it dynamically loads the state from 
     * the file system (`cli-use/changes/latest/plan.json`) and appends it to the system context.
     */
    "chat.params": async (input: any, output: any, ctx?: any) => {
      const agentId = ctx?.activeAgentId || input?.agent;
      if (agentId === "cli-use-implementer") {
        const state = await getPlanState("latest");
        if (state) {
          const planStr = `\n\nLatest Plan:\n${JSON.stringify(state, null, 2)}`;
          // Append the parsed file system state to the system prompt
          if (output.system) {
            output.system += planStr;
          } else {
            output.system = planStr;
          }
        }
      }
    },

    /**
     * `tool.execute.after` hook: Background Stateless Validation.
     * Intercepts "edit" and "write" filesystem operations immediately after completion 
     * but before the LLM considers the tool call successful. It executes `validateCode()`
     * and throws an error to the LLM if forbidden patterns (like `console.log`) are detected.
     */
    "tool.execute.after": async (input: any) => {
      const toolName = input.tool;
      if (toolName === "edit" || toolName === "write") {
        // Extract the code string depending on the tool's parameter schema
        const code = toolName === "edit" ? input.args.newString : input.args.content;
        
        // Pass to the headless validation core
        if (code && !validateCode(code)) {
          throw new Error("Code validation failed: console.log is not allowed");
        }
      }
    },

    /**
     * Exposes the custom `save_plan` tool to the agent.
     * Defines strict Zod arguments and acts as the bridge invoking the core `savePlan` utility.
     */
    tool: {
      save_plan: tool({
        description: "Save a TDD architecture plan.",
        args: {
          proposal: z.string().describe("The change proposal"),
          specs: z.string().describe("The specifications"),
          design: z.string().describe("The design document"),
          tasks: z.array(
            z.object({
              id: z.string().describe("Task identifier"),
              description: z.string().describe("Task description"),
              status: z.string().describe("Task status (e.g., 'pending', 'in-progress', 'done')")
            })
          ).describe("List of tasks")
        },
        execute: async (args, _context) => {
          await savePlan("latest", args);
          return "Plan saved successfully to cli-use/changes/latest/plan.json.";
        }
      })
    }
  };
};
