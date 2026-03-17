import { Plugin } from "@opencode-ai/plugin";
import { getPlanState } from "../core/state.js";
import { validateCode } from "../core/validator.js";

const plugin: Plugin = async (_ctx) => {
  return {
    config: async (cfg: any) => {
      cfg.agent = cfg.agent || {};
      cfg.command = cfg.command || {};

      cfg.agent["cli-use-planner"] = {
        description: "An architect/planner that analyzes requirements and designs a plan. Cannot write code.",
        prompt: "You are the CLI Use Planner. Analyze requirements, read files, and design a comprehensive plan. When the plan is ready, save it using the `save_plan` tool. You cannot write code. Do not attempt to modify files directly.",
        permission: {
          edit: "deny"
        }
      };

      cfg.agent["cli-use-implementer"] = {
        description: "An implementer agent that writes code based on the saved plan.",
        prompt: "You are the CLI Use Implementer. Read the plan saved by the planner and implement the code according to the plan."
      };

      cfg.command.propose = {
        agent: "cli-use-planner",
        description: "Engage the planner to propose a change and save it to a plan",
        template: "Act as the CLI Use Planner. Analyze the following request and create a detailed plan using the save_plan tool: $ARGUMENTS"
      };

      cfg.command.implement = {
        agent: "cli-use-implementer",
        description: "Engage the implementer to write code based on the latest saved plan",
        template: "Act as the CLI Use Implementer. Read the latest plan and implement it. $ARGUMENTS"
      };
    },

    "chat.params": async (input: any, output: any, ctx?: any) => {
      const agentId = ctx?.activeAgentId || input?.agent;
      if (agentId === "cli-use-implementer") {
        const state = await getPlanState("latest");
        if (state) {
          const planStr = `\n\nLatest Plan:\n${JSON.stringify(state, null, 2)}`;
          if (Array.isArray(output.system)) {
            output.system.push(planStr);
          } else if (typeof output.system === 'string') {
            output.system += planStr;
          } else {
            output.system = planStr;
          }
        }
      }
    },

    "tool.execute.after": async (input: any, output: any) => {
      const toolName = input.tool;
      if (toolName === "Edit" || toolName === "Write" || toolName === "edit" || toolName === "write") {
        const code = output.output || (input.args && (input.args.newString || input.args.content));
        if (code && !validateCode(code)) {
          throw new Error("Validation Failed");
        }
      }
    }
  };
};

export default plugin;
