# cli-use-core

[![npm version](https://badge.fury.io/js/cli-use-core.svg)](https://badge.fury.io/js/cli-use-core)

An Agentic Planning and TDD (Test-Driven Development) CLI adapter tool.

## 🚀 Installation & Setup

**1. Install the package**

```bash
npm install cli-use-core
```

**2. Setup for OpenCode**

Create an `opencode-plugin.ts` file in your project root to export the plugin:

```typescript
import { cliUsePlugin } from "cli-use-core/plugin";

export default cliUsePlugin;
```

Then, create or update `.opencode/opencode.json` to load your local plugin file (you can copy the `opencode.example.json` from this repository as a reference):

```json
{
  "plugin": [
    "../opencode-plugin.ts"
  ]
}
```

**3. Setup for Claude Code (Optional)**

If you are using Claude Code, you need to copy the plugin hooks and prompts into your project root:

```bash
cp -r node_modules/cli-use-core/.claude-plugin .
```

---

## 🧠 The Dual-Agent Workflow (Idea to Implementation)

This tool separates the *thinking* from the *doing*. Instead of a single AI trying to design and code simultaneously (which often leads to hallucinations), we use a strict two-step pipeline.

**Phase 1: Architecture & Planning**
Start by asking the **Planner Agent** to architect your feature. The planner cannot write code—its only job is to analyze your codebase, clarify requirements, and write a strict specification plan.

```bash
npx opencode run "/propose Add a new authentication system with JWT"
```
*Result: The planner uses the `save_plan` tool to generate a detailed spec and task list, saving it locally to `cli-use/changes/latest/plan.json`.*

**Phase 2: Test-Driven Implementation**
Once the plan is saved, you switch to the **Implementer Agent** to execute it in a new session. The implementer automatically reads the plan generated in Phase 1 and begins coding step-by-step.

```bash
npx opencode run "/implement start by writing the tests for task 1"
```
*Result: The implementer strictly follows the `plan.json`, writes the tests first, implements the logic, and executes your project's test suite to ensure everything passes.*

#### Workflow Diagram

```mermaid
sequenceDiagram
    actor User
    participant CLI as OpenCode CLI
    participant Planner as Planner Agent
    participant FS as File System
    participant Impl as Implementer Agent

    Note over User, Impl: Phase 1: Architecture & Planning
    User->>CLI: run "/propose <idea>"
    CLI->>Planner: Trigger /propose command
    Planner->>Planner: Analyze Codebase & Requirements
    Planner->>FS: 💾 Call `save_plan` tool
    FS-->>User: plan.json saved!

    Note over User, Impl: Phase 2: Test-Driven Implementation (New Session)
    User->>CLI: run "/implement <instructions>"
    CLI->>Impl: Trigger /implement command
    FS-->>Impl: 📖 Auto-inject plan.json context
    Impl->>Impl: Write Tests (TDD)
    Impl->>Impl: Write Implementation Code
    Impl->>Impl: Run Tests & Verify
    Impl-->>User: Task completed successfully!
```

---

This tool acts as your automated Tech Lead within dual-agent contexts across platforms like **OpenCode** and **Claude Code**. It generates strict Product Requirements (Specs), Test Plans, and Implementation Steps _before_ you write a single line of code, preventing AI hallucinations and saving hours of debugging.

## ✨ Features

- **Platform Agnostic Core:** The core logic is headless and stateless, running smoothly inside OpenCode (in-process) and Claude Code (out-of-process).
- **Markdown-as-State:** All plans are saved locally to `cli-use/changes/latest/plan.json` so you never lose context.
- **Silent Guardians:** Invisible background validation prevents bad or destructive AI code edits (e.g., leaving `console.log` statements in generated code).

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
   Ensure you create an `opencode-plugin.ts` file in the root that exports the built plugin:
   ```typescript
   import { cliUsePlugin } from "./dist/opencode-plugin.js";

   export default cliUsePlugin;
   ```
   And then load it in `.opencode/opencode.json` (see `opencode.example.json`):
   ```json
   {
     "plugin": [
       "../opencode-plugin.ts"
     ]
   }
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
