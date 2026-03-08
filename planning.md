# cli-use-tdd: Engineering Plan

This document outlines the focused engineering tasks to complete and polish the `cli-use-tdd` MVP, adhering to a strict Test-Driven Development (TDD) approach.

## 🎯 Phase 1: Fulfill "Bring Your Own Model" (BYOM) & Key Rotation

**Context:** The CLI allows users to select models, but `src/ai.ts` currently ignores the `_config` argument and hardcodes `gemini-2.0-flash`.

- [ ] **Task 1.1 [Test]**: Write unit tests for `src/ai.ts` to ensure `generateSpec` and `generateTddPlan` invoke the dynamically selected model based on the provided configuration.
- [ ] **Task 1.2 [Impl]**: Refactor `src/ai.ts` to dynamically instantiate the AI model using `getModel(config)` from `models.ts`. Remove the hardcoded `@ai-sdk/google` import to enable true lazy-loading of providers.

## 📝 Phase 2: Fulfill "Markdown-as-State"

**Context:** The README advertises "Markdown-as-State", but the application currently only saves raw JSON to `.planning/db.json`. We need human-readable `.md` files.

- [ ] **Task 2.1 [Test]**: Write unit tests for a new module `src/lib/markdown-exporter.ts` that converts the `SpecSchema` and `PlanSchema` objects into formatted Markdown strings.
- [ ] **Task 2.2 [Impl]**: Implement `src/lib/markdown-exporter.ts`.
- [ ] **Task 2.3 [Impl]**: Update `runSpecPhase` and `runPlanPhase` in `src/index.tsx` to generate and write `spec.md` and `plan.md` to the `.planning/` directory alongside `db.json`.

## 🛡️ Phase 3: Dogfooding & TDD Completeness

**Context:** Ensure the core logic of this TDD tool is robust by adding necessary tests.

- [ ] **Task 3.1 [Test & Impl]**: Write tests for `src/lib/models.ts` to verify the `ProviderMissingError` is thrown correctly when an SDK package is not installed.
- [ ] **Task 3.2 [Test & Impl]**: Write tests for `src/db.ts` to verify that `lowdb` correctly initializes the default state if `.planning/db.json` is missing or malformed.
- [ ] **Task 3.3 [Impl]**: Add a GitHub Actions CI workflow to run `npm run lint`, `npm run typecheck`, and `npm run test` automatically.

## 🚀 Phase 4: Interactive CLI Polish

**Context:** Improve the user experience after the plan is generated. Right now, the CLI just exits.

- [ ] **Task 4.1 [Impl]**: Add an interactive Ink UI component that displays the generated steps from `db.json` inside the terminal.
- [ ] **Task 4.2 [Impl]**: Allow the user to select a task from the UI and mark it as "in progress" or "done", effectively using `cli-use-tdd` to track the execution of its own plans.
