# cli-use-tdd

An Agentic Planning and TDD (Test-Driven Development) CLI tool.

Built with **React**, **Ink**, and the **Vercel AI SDK**, this tool acts as your automated Tech Lead. It generates strict Product Requirements (Specs), Test Plans, and Implementation Steps _before_ you write a single line of code, preventing AI hallucinations and saving hours of debugging.

## ✨ Features

- **Bring Your Own Model (BYOM):** We don't lock you into a single provider. Use OpenAI, Anthropic, Google Gemini, Groq, or local models via Ollama.
- **Dynamic Loading:** We keep our core package tiny. You only install the AI SDKs you actually use.
- **Markdown-as-State:** All plans are saved locally to `cli-use/changes/latest/plan.json` so you never lose context.
- **Multi-Key Rotation:** Automatically round-robins Google API keys to bypass rate limits on free tiers.

---

## 🛠️ Local Development & Testing

This project implements a dual-agent context across both **OpenCode** and **Claude Code** platforms.

### Prerequisites & Building

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Build the Plugin:**
   The core logic and the OpenCode plugin adapter are bundled using `tsup`.
   ```bash
   npm run build
   ```
   *This outputs `dist/index.js` (core) and `dist/opencode-plugin.js` (OpenCode adapter).*

3. **Verify the Codebase:**
   Before running agents, ensure all strict TDD constraints are met:
   ```bash
   npm run lint        # Validates code formatting and rules
   npm run typecheck   # Validates TypeScript typings
   npm run test        # Runs the Vitest suite covering Core, OpenCode, and Claude Code adapters
   ```

---

### 🧪 Testing the OpenCode Adapter Locally

The OpenCode adapter registers the `cli-use-planner` and `cli-use-implementer` agents programmatically, alongside custom `/propose` and `/implement` commands.

1. **Configure OpenCode:**
   Ensure your local OpenCode configuration (e.g., `opencode.config.ts`) imports and registers the built plugin:
   ```typescript
   import { cliUseTddPlugin } from "./dist/opencode-plugin.js";

   export default {
     plugins: [cliUseTddPlugin],
   };
   ```

2. **Engage the Planner:**
   Use the custom `/propose` command to trigger the `cli-use-planner` agent. The planner will analyze requirements and use the `save_plan` tool to write the state to disk.
   ```bash
   npx opencode run "/propose Add a new authentication system"
   ```

3. **Engage the Implementer:**
   Use the custom `/implement` command to trigger the `cli-use-implementer`. This agent uses the `chat.params` hook to automatically read `cli-use/changes/latest/plan.json` into its system prompt context.
   ```bash
   npx opencode run "/implement Let's start with task 1"
   ```

*Note on OpenCode Validation:* If the implementer attempts to write forbidden code (e.g., leaving `console.log` in the file), the `tool.execute.after` hook will intercept the action and silently throw an error to the LLM to force self-correction.

---

### 🤖 Testing the Claude Code Adapter Locally

The Claude Code adapter uses static manifests (`.claude-plugin/`), a `SKILL.md` file for permissions, and `stdin`-based Node scripts to validate execution.

1. **Start Claude Code:**
   Launch Claude Code within the repository root so it automatically detects the `.claude-plugin` directory:
   ```bash
   claude
   ```

2. **Use the Custom Commands:**
   Invoke the markdown-defined commands directly in the prompt:
   - Type `/propose [your goal]` to switch to the `planner` persona. The planner uses the bash-wrapped `save_plan.ts` script to generate architecture plans.
   - Type `/implement` to switch to the `implementer` persona, which reads `.planning/db.json` (or the respective JSON plan).

3. **Test Stateless Validation (The Silent Guardian):**
   When the implementer tries to edit or write a file using Claude Code's native tools, the `.claude-plugin/hooks.json` maps `PreToolUse` hooks to `bin/claude-validate.ts`. 
   
   To manually test this validation script:
   ```bash
   # Valid code (Exits 0)
   echo '{"newString": "const x = 1;"}' | npx tsx bin/claude-validate.ts
   
   # Invalid code (Blocks execution, Exits 2)
   echo '{"newString": "console.log(\"test\");"}' | npx tsx bin/claude-validate.ts
   ```

---

## 🤖 Supported Models & Providers

Because `cli-use-tdd` uses dynamic imports, you only need to install the provider package for the model you intend to use.

Choose your preferred provider from the table below, install the package, and add the corresponding key to your `.env` file.

| Provider / Model                  | NPM Package Required | Environment Variable | Best For                                                             |
| :-------------------------------- | :------------------- | :------------------- | :------------------------------------------------------------------- |
| **Anthropic** (Claude 3.7 Sonnet) | `@ai-sdk/anthropic`  | `ANTHROPIC_API_KEY`  | **Complex TDD & Coding.** Currently the industry best for reasoning. |
| **OpenAI** (GPT-4o)               | `@ai-sdk/openai`     | `OPENAI_API_KEY`     | **Reliability & Speed.** The standard balanced choice.               |
| **Google** (Gemini 1.5 Pro)       | `@ai-sdk/google`     | `GOOGLE_API_KEYS`\*  | **Massive Context.** Can read your entire codebase (2M tokens).      |
| **Groq** (Llama 3 70B)            | `@ai-sdk/groq`       | `GROQ_API_KEY`       | **Ultra-Fast Generation.** Best for rapid prototyping.               |
| **Ollama** (Local Models)         | `ollama-ai-provider` | _None required_      | **Privacy & Free Usage.** Runs 100% locally on your machine.         |

_\* `GOOGLE_API_KEYS` supports multiple keys separated by commas (e.g., `key1,key2`) for automatic rate-limit bypassing._

---

## 🚀 Installation & Quick Start

**1. Install the package as a dev dependency**

```bash
npm install --save-dev @cli-use/core
```

**2. Initialize the Claude Code Plugin (Optional)**

If you are using Claude Code, you need to copy the plugin hooks and prompts into your project root:

```bash
cp -r node_modules/@cli-use/core/.claude-plugin .
```
