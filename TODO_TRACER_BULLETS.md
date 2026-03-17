# TODO_TRACER_BULLETS: Execution Manual

## STRICT EXECUTION CONSTRAINTS
**WARNING TO EXECUTION LLM:** You are operating in a highly constrained environment. Read these axioms before writing ANY code. Do NOT rely on previous knowledge of generic CLI tools or plugin architectures.

1. **THE UNIVERSAL CORE AXIOM:** The core business logic (`src/engine/` or `src/core/`) MUST remain 100% headless, stateless, and platform-agnostic. NEVER import `@opencode-ai/plugin` or assume any specific execution environment in the core. It must accept raw text/paths and return strict JSON.
2. **THE STATELESS AXIOM:** State MUST always be derived from the File System at the moment of execution. DO NOT use long-lived memory variables (`const activeChanges = new Map()`). State is tracked EXCLUSIVELY via `cli-use/changes/<feature-name>/plan.json`.
3. **THE INJECTION VS BLOCKING AXIOM:** 
   - **OpenCode:** Use `chat.params` to silently *inject* state into the context.
   - **Claude Code:** Use shell hook exit codes (e.g., `exit 2`) to *block* illegal moves.
4. **THE SILENT GUARDIAN AXIOM:** Validation must be invisible, continuous, and self-healing. When a file is modified, read `plan.json` in the background. If the code violates rules, inject a system-level error back into the AI context to force self-correction without showing it to the user.
5. **NO PROMPT REGISTRIES:** Do NOT build adapters for formatting prompts. Rely entirely on the AI's native tool-calling capabilities.
6. **ZERO TELEMETRY:** Absolute zero telemetry wrappers. Period.

## DATA SCHEMA: `plan.json`
The absolute source of truth for the project phase, stored at `cli-use/changes/<feature-name>/plan.json`.
- `proposal` (String, Req): High-level feature summary.
- `specs` (String, Req): Technical specifications and behavior requirements.
- `design` (String, Req): System architecture and trade-offs.
- `tasks` (Array, Req): Ordered implementation tasks.
  - `id` (String, Req): Unique step ID.
  - `description` (String, Req): Detailed instruction for the Implementer Agent.
  - `status` (Enum, Req): `"pending"`, `"in-progress"`, `"completed"`.

## ENVIRONMENT QUIRKS
### OpenCode (In-Process JS)
- Runs inside the same memory process.
- Registration: Programmatic via `config.agent` and `config.command`.
- Tools: Exposed natively via `@opencode-ai/plugin/tool` leveraging Zod schemas.
- Interception: `chat.params` for context injection, `tool.execute.after` for silent post-save validation.

### Claude Code (Out-of-Process Shell)
- Spins up a brand new Node process for EVERY hook. Ephemeral execution.
- Registration: Declarative via markdown files (`.claude-plugin/plugin.json`, `agents/*.md`, `commands/*.md`).
- Tools: Granted via `SKILL.md` YAML frontmatter (`allowed-tools: Bash(node ...)`).
- Interception: Handled via `hooks.json` mapping `PreToolUse` and `PostToolUse` to lightweight Node CLI scripts reading from `stdin` and communicating via `stdout`/`stderr` JSON and process exit codes.

---

## THE 3 TRACER BULLET PHASES (ACTION PLAN)

### Phase 1: Build the Headless Core (Tier 1)
- [x] Create `src/engine/` containing pure TypeScript logic.
- [ ] Implement `dag.ts`: The State Resolver calculating available next steps based on file system presence.
- [ ] Implement `merger.ts`: Parses delta Markdown specs and merges them into the `plan.json`.
- [x] Implement `validator.ts`: Ensures output matches the required `plan.json` schema and architecture constraints.
- *Constraint Check:* Ensure NO framework-specific SDKs are imported in this tier.

### Phase 2: Build the OpenCode Adapter (Tier 2)
- [x] Create `src/opencode/index.ts`.
- [x] Register `openspec-planner` and `cli-use-implementer` agents via OpenCode native config.
- [x] Implement `chat.params` hook to inject the current DAG state into the LLM context (forcing phase adherence).
- [x] Expose `save_plan` as a native async tool using Zod validation.
- [x] Implement `tool.execute.after` hook to silently run `validator.ts` on file saves, intercepting and rejecting invalid AI code edits.

### Phase 3: Build the Claude Code Adapter (Tier 3)
- [x] Create `.claude-plugin/` configuration.
- [x] Create Static Markdown Agent Definitions (`agents/*.md`) and Commands (`commands/*.md`).
- [x] Write `SKILL.md` wrappers granting Bash execution permission to invoke core scripts.
- [x] Create lightweight Node CLI wrappers (`bin/claude-validate.js`) for `hooks.json` that read from `stdin`.
- [x] Configure `PreToolUse`/`PostToolUse` shell scripts to block invalid AI actions via standard exit codes (e.g., exiting with `2` if AI acts prematurely).


### Phase 4: NPM Publishing Preparation
- [x] Update `package.json` with `"name": "cli-use"`, remove `"bin"`, and add `repository`, `description`, `author`, `license`, `keywords`.
- [x] Add `"files": ["dist", ".claude-plugin"]` to `package.json` to whitelist distribution files.
- [x] Update build script in `package.json` to compile `bin/claude-validate.ts` into plain JavaScript at `dist/claude-validate.js`.
- [x] Update `.claude-plugin/hooks.json` to execute `node dist/claude-validate.js`.
- [x] Install `np` as a development dependency.
- [x] Add `"release": "np"` and `"prepublishOnly": "npm run build && npm run typecheck && npm run test"` to scripts in `package.json`.
