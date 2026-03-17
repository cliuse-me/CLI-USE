# CLI-USE-PLANNER: Execution Context & Tracer Bullet Tasks

**ATTENTION EXECUTING LLM:** 
You are building a cross-platform AI Plugin. You must adhere to the non-negotiable axioms below. Any task labeled with an `[Agent]` must be executed using that specific persona. Any task with a `[Worktree]` must initiate from that directory.

---

## PART 1: THE NON-NEGOTIABLE ARCHITECTURAL CONSTRAINTS

1. **The Universal Core Constraint (`src/core/`)**
   * Business logic must be entirely headless, stateless, and platform-agnostic. No SDK imports in `src/core/`.
2. **The State Management Constraint**
   * State is derived entirely from the File System at `cli-use/changes/<feature-name>/plan.json`. No global variables.
3. **The Shell Injection Immunity Constraint (Claude Code)**
   * Payloads MUST be piped via `stdin`. Never use command-line flags for LLM data.
4. **The Agent Switching Paradigm**
   * UX relies on swapping personas: `cli-use-planner` vs `cli-use-implementer`. No React/Ink UI.
5. **The Schema Definition (`plan.json`)**
   * Enforce Zod schema: `proposal`, `specs`, `design`, `tasks`.
6. **The "Bring Your Own Model" (BYOM) Constraint**
   * Never hardcode `model` in agent configs. Strip all `ai` or `@ai-sdk/*` dependencies.

---

## PART 2: THE TRACER BULLET TASK LIST

**FOOLPROOF TEST ENFORCEMENT:** 
For each task, you MUST create the specified `.test.ts` file exactly with the provided assertions. You MUST NOT modify the test assertions. You must then execute the specified Verification Command to prove your implementation.

### Phase 1: Dual-Agent Handoff & Core Engine

- [x] **Task 0: Cleanup Legacy Code**
  * **Agent:** `/architect`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Delete `src/ai.ts` and `src/lib/models.ts`. Run `npm uninstall ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/groq ollama-ai-provider`.
  * **Verification Command:** `npm run build`

- [x] **Task 1: Core DB Implementation**
  * **Agent:** `/architect`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Create `src/core/db.ts`. Implement `savePlan(featureName: string, payload: any)` using `fs-extra` to write to `cli-use/changes/<featureName>/plan.json`.
  * **Test Requirement:** Create `src/core/db.test.ts`:
    ```typescript
    import { describe, it, expect, vi } from 'vitest';
    import { savePlan } from './db';
    import fs from 'fs-extra';
    vi.mock('fs-extra');
    describe('savePlan', () => {
      it('writes valid payload to correct feature path', async () => {
        const payload = { proposal: 'a', specs: 'b', design: 'c', tasks: [] };
        await savePlan('my-feature', payload);
        expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('cli-use/changes/my-feature'));
        expect(fs.writeJson).toHaveBeenCalledWith(
          expect.stringContaining('cli-use/changes/my-feature/plan.json'),
          expect.objectContaining(payload),
          expect.any(Object)
        );
      });
    });
    ```
  * **Verification Command:** `npx vitest run src/core/db.test.ts`

- [x] **Task 2: OpenCode Agent Registration**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Modify `src/opencode/index.ts`. Register `cli-use-planner` and `cli-use-implementer` in `config.agent`. Ensure `model` is omitted.
  * **Verification Command:** `npx vitest run src/opencode/index.test.ts` (Asserting agents and tool constraints).

- [x] **Task 3: OpenCode Command Registration**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Add `/propose` and `/implement` commands to `config.command`.
  * **Verification Command:** `npx vitest run src/opencode/index.test.ts` (Asserting command to agent mapping).

- [x] **Task 4: Claude Code Manifests**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Create `.claude-plugin/commands/propose.md` and `implement.md`.
  * **Verification Command:** `ls .claude-plugin/commands/*.md`

- [x] **Task 5: Claude Code Persona Definitions**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Create `.claude-plugin/agents/planner.md` and `implementer.md`.
  * **Verification Command:** `grep "MUST NOT write code" .claude-plugin/agents/planner.md`

### Phase 2: State Injection (The Context Builder)

- [x] **Task 1: Core State Retrieval**
  * **Agent:** `/architect`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Create `src/core/state.ts`. Implement `getPlanState(featureName)` reading JSON from disk.
  * **Verification Command:** `npx vitest run src/core/state.test.ts`

- [x] **Task 2: OpenCode Context Injection**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Implement `chat.params` hook in `index.ts`. Inject result of `getPlanState` into `output.system`.
  * **Verification Command:** `npx vitest run src/opencode/index.test.ts`

### Phase 3: The Silent Guardian (Stateless Validation)

- [x] **Task 1: Core Validation Engine**
  * **Agent:** `/architect`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Create `src/core/validator.ts`. Pure function `validateCode(code)` checking for `console.log`.
  * **Verification Command:** `npx vitest run src/core/validator.test.ts`

- [x] **Task 2: OpenCode Background Validation**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Implement `tool.execute.after`. Intercept `Edit/Write`, run validator, and throw Error if failed.
  * **Verification Command:** `npx vitest run src/opencode/index.test.ts`
