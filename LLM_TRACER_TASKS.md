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
        await savePlan('test-feature', payload);
        expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('cli-use/changes/test-feature'));
        expect(fs.writeJson).toHaveBeenCalledWith(
          expect.stringContaining('cli-use/changes/test-feature/plan.json'),
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
  * **Action:** Modify `src/opencode/index.ts`. Register `cli-use-planner` and `cli-use-implementer` in `config.agent`.
  * **Test Requirement:** Create `src/opencode/index.test.ts`:
    ```typescript
    import { describe, it, expect, vi } from 'vitest';
    import plugin from './index';

    describe('OpenCode Adapter Registration', () => {
      it('registers planner and implementer without model property', async () => {
        const result = await plugin({} as any);
        const config: any = {};
        await result.config!(config);
        
        expect(config.agent['cli-use-planner']).toBeDefined();
        expect(config.agent['cli-use-planner'].model).toBeUndefined();
        expect(config.agent['cli-use-implementer']).toBeDefined();
        expect(config.agent['cli-use-implementer'].model).toBeUndefined();
      });
    });
    ```
  * **Verification Command:** `npx vitest run src/opencode/index.test.ts`

- [x] **Task 3: OpenCode Command Registration**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Add `/propose` and `/implement` commands to `config.command`.
  * **Test Requirement:** Append to `src/opencode/index.test.ts`:
    ```typescript
    it('registers /propose and /implement commands', async () => {
      const result = await plugin({} as any);
      const config: any = {};
      await result.config!(config);
      
      expect(config.command.propose).toBeDefined();
      expect(config.command.propose.agent).toBe('cli-use-planner');
      expect(config.command.implement).toBeDefined();
      expect(config.command.implement.agent).toBe('cli-use-implementer');
    });
    ```
  * **Verification Command:** `npx vitest run src/opencode/index.test.ts`

- [x] **Task 4: Claude Code Manifests**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Create `.claude-plugin/commands/propose.md` and `implement.md`.
  * **Test Requirement:** Create `src/claude/commands.test.ts`:
    ```typescript
    import { describe, it, expect } from 'vitest';
    import fs from 'fs-extra';

    describe('Claude Code Commands', () => {
      it('has propose.md and implement.md in the correct directory', () => {
        expect(fs.existsSync('.claude-plugin/commands/propose.md')).toBe(true);
        expect(fs.existsSync('.claude-plugin/commands/implement.md')).toBe(true);
      });
    });
    ```
  * **Verification Command:** `npx vitest run src/claude/commands.test.ts`

- [x] **Task 5: Claude Code Persona Definitions**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Create `.claude-plugin/agents/planner.md` and `implementer.md`.
  * **Test Requirement:** Append to `src/claude/commands.test.ts`:
    ```typescript
    it('has planner.md and implementer.md with correct constraints', () => {
      const planner = fs.readFileSync('.claude-plugin/agents/planner.md', 'utf-8');
      expect(planner).toContain('MUST NOT write implementation code');
      const implementer = fs.readFileSync('.claude-plugin/agents/implementer.md', 'utf-8');
      expect(implementer).toContain('MUST read the .planning/db.json file');
    });
    ```
  * **Verification Command:** `npx vitest run src/claude/commands.test.ts`

### Phase 2: State Injection (The Context Builder)

- [x] **Task 1: Core State Retrieval**
  * **Agent:** `/architect`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Create `src/core/state.ts`. Implement `getPlanState(featureName)` reading JSON from disk.
  * **Test Requirement:** Create `src/core/state.test.ts`:
    ```typescript
    import { describe, it, expect, vi } from 'vitest';
    import { getPlanState } from './state';
    import fs from 'fs-extra';
    vi.mock('fs-extra');
    describe('getPlanState', () => {
      it('reads plan.json and returns string', async () => {
        vi.mocked(fs.readJson).mockResolvedValue({ proposal: 'test' });
        const state = await getPlanState('my-feature');
        expect(fs.readJson).toHaveBeenCalledWith(expect.stringContaining('cli-use/changes/my-feature/plan.json'));
        expect(state).toContain('test');
      });
    });
    ```
  * **Verification Command:** `npx vitest run src/core/state.test.ts`

- [x] **Task 2: OpenCode Context Injection**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Implement `chat.params` hook in `index.ts`. Inject result of `getPlanState` into `output.system`.
  * **Test Requirement:** Append to `src/opencode/index.test.ts`:
    ```typescript
    it('injects state into system prompt via chat.params', async () => {
      const result = await plugin({} as any);
      const output = { system: [] as string[] };
      // Simulate input with feature name in context or args
      await result['chat.params']!({ sessionID: '123' } as any, output as any);
      // Expectations would depend on how featureName is resolved
    });
    ```
  * **Verification Command:** `npx vitest run src/opencode/index.test.ts`

### Phase 3: The Silent Guardian (Stateless Validation)

- [x] **Task 1: Core Validation Engine**
  * **Agent:** `/architect`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Create `src/core/validator.ts`. Pure function `validateCode(code)` checking for `console.log`.
  * **Test Requirement:** Create `src/core/validator.test.ts`:
    ```typescript
    import { describe, it, expect } from 'vitest';
    import { validateCode } from './validator';
    describe('validateCode', () => {
      it('returns true for clean code', () => {
        expect(validateCode('const x = 1;')).toBe(true);
      });
      it('returns false for code with console.log', () => {
        expect(validateCode('console.log("bad");')).toBe(false);
      });
    });
    ```
  * **Verification Command:** `npx vitest run src/core/validator.test.ts`

- [x] **Task 2: OpenCode Background Validation**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/OpenSpec/CLI-USE-SKILLS/`
  * **Action:** Implement `tool.execute.after`. Intercept `Edit/Write`, run validator, and throw Error if failed.
  * **Test Requirement:** Append to `src/opencode/index.test.ts`:
    ```typescript
    it('blocks invalid tool execution in tool.execute.after', async () => {
      const result = await plugin({} as any);
      const output = { output: 'console.log("bad")' };
      await expect(result['tool.execute.after']!({ tool: 'Edit' } as any, output as any))
        .rejects.toThrow('Validation Failed');
    });
    ```
  * **Verification Command:** `npx vitest run src/opencode/index.test.ts`

### Phase 4: NPM Publishing Preparation

- [ ] **Task 1: Package Metadata Updates**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/cli-use-tdd/`
  * **Action:** Update `package.json` with `"name": "cli-use"`, remove `"bin"`, add `"repository": "git+https://github.com/cliuse-me/CLI-USE.git"`, and add metadata (`description`, `author`, `license`, `keywords`).
  * **Test Requirement:** Create `src/npm.test.ts`:
    ```typescript
    import { describe, it, expect } from 'vitest';
    import fs from 'fs-extra';
    describe('NPM Package Metadata', () => {
      it('has correct name and no bin field', async () => {
        const pkg = await fs.readJson('package.json');
        expect(pkg.name).toBe('cli-use');
        expect(pkg.bin).toBeUndefined();
        expect(pkg.repository).toBe('git+https://github.com/cliuse-me/CLI-USE.git');
      });
    });
    ```
  * **Verification Command:** `npx vitest run src/npm.test.ts`

- [ ] **Task 2: Build & Distribution Whitelist**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/cli-use-tdd/`
  * **Action:** Update `package.json` to include `"files": ["dist", ".claude-plugin"]`.
  * **Test Requirement:** Append to `src/npm.test.ts`:
    ```typescript
    it('has correct files whitelist', async () => {
      const pkg = await fs.readJson('package.json');
      expect(pkg.files).toContain('dist');
      expect(pkg.files).toContain('.claude-plugin');
    });
    ```
  * **Verification Command:** `npx vitest run src/npm.test.ts`

- [ ] **Task 3: Claude Code Standalone Compilation**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/cli-use-tdd/`
  * **Action:** Update `build` script in `package.json` to include `bin/claude-validate.ts`. Update `.claude-plugin/hooks.json` to use `node dist/claude-validate.js`.
  * **Test Requirement:** Append to `src/npm.test.ts`:
    ```typescript
    it('compiles validate script and uses it in hooks', async () => {
      const pkg = await fs.readJson('package.json');
      expect(pkg.scripts.build).toContain('bin/claude-validate.ts');
      const hooks = await fs.readJson('.claude-plugin/hooks.json');
      expect(hooks.PreToolUse.Edit).toContain('node dist/claude-validate.js');
    });
    ```
  * **Verification Command:** `npx vitest run src/npm.test.ts`

- [ ] **Task 4: Release Automation (`np`)**
  * **Agent:** `/adapter`
  * **Worktree:** `/Users/arthursantos/Desktop/cli-use-tdd/`
  * **Action:** Install `np` as dev dependency. Add `"release": "np"` and `"prepublishOnly": "npm run build && npm run typecheck && npm run test"` to scripts.
  * **Test Requirement:** Append to `src/npm.test.ts`:
    ```typescript
    it('has np release automation configured', async () => {
      const pkg = await fs.readJson('package.json');
      expect(pkg.devDependencies.np).toBeDefined();
      expect(pkg.scripts.release).toBe('np');
      expect(pkg.scripts.prepublishOnly).toContain('npm run build');
    });
    ```
  * **Verification Command:** `npx vitest run src/npm.test.ts`
