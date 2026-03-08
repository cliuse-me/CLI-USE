# 🤖 `cli-use-tdd`: Hybrid LLM Router Blueprint (MVP)

This document defines the OpenCode Plugin & CLI MVP as a sequence of **Vector Space Transformations**. Each issue represents an atomic **Operator** ($\Omega$) that maps an input space (User Intent) to an output space (Structured Architecture), ensuring a mathematically closed-loop system for reliable AI generation.

---

## 🏛️ System Architecture: The Chain of Semantic Spaces

The system is defined as a transformation across a sequence of discrete semantic spaces:

### 1. The Global Planning Space ($\mathcal{V}_{plan}$)

The total state of the generation universe is a vector $v \in \mathcal{V}_{plan}$ defined by the basis:
$$\mathcal{B}_{plan} = \{ \vec{g}, \vec{c}, \vec{s}, \vec{t} \}$$

- $\vec{g} \in G$: Goal Subspace (Raw user intent string).
- $\vec{c} \in C$: Clarification Subspace (Agnostic text responses).
- $\vec{s} \in S$: Specification Subspace (Strict JSON Product Spec).
- $\vec{t} \in T$: TDD Plan Subspace (Strict JSON Architecture Plan).

### 2. Operational Pipeline

The Epic is a sequence of LLM Operators ($\Omega$) that project vectors from unstructured intent into structured engineering data:
$$V_{goal} \xrightarrow{\Omega_{clarify}} V_{clarified} \xrightarrow{\Omega_{spec}} V_{spec} \xrightarrow{\Omega_{tdd}} V_{plan} \xrightarrow{\Omega_{persist}} V_{disk}$$

---

## 🔄 System Lifecycle Diagrams

### 1. Planning State Machine (Entity Lifecycle)

This diagram defines the allowed transitions in the Internal Domain Space $\mathcal{S}$.

```text
       [ IDLE ]
          |
          v
  +---------------+       (Agnostic LLM)        +---------------+
  |  CLARIFYING   | --------------------------> |    CLEAR      |
  +---------------+                             +---------------+
          | (User loop if ambiguous)                    |
          v                                             v
  +---------------+       (Gemini 2.0 Flash)    +---------------+
  | RE-PROMPTING  |                             | SPEC_GENERATE |
  +---------------+                             +---------------+
                                                        |
                                                        v
  +---------------+       (Gemini 2.0 Flash)    +---------------+
  |     DONE      | <-------------------------- | TDD_GENERATE  | (TERMINAL SUCCESS)
  +---------------+                             +---------------+
          |
          v
  [ .planning/db.json ]
```

### 2. The Hybrid Router Flow (Event Sequence)

This diagram shows the routing logic between cheap agnostic models and the complex SDK.

```text
Command      AIEngine          Agnostic LLM       Vercel AI SDK      Local DB
   |            |                   |                   |               |
   |--[Goal]--> |                   |                   |               |
   |            |--[1. Chat]------->|                   |               |
   |            |<--[2. "CLEAR"]----|                   |               |
   |            |                   |                   |               |
   |            |--[3. StructGen]---------------------->|               |
   |            |                   | (If NO Key)       | (If GEMINI Key)
   |            |                   |<--[Fallback]      |               |
   |            |<------------------|-------------------|               |
   |            |                   |                   |               |
   |            |--[4. Save State]------------------------------------->|
   |            |                                                       |
```

---

## 🗺️ The Atomic Operator Roadmap (8-Step Execution)

### Phase 1: The Foundation (Schemas & Resilience)

#### [TDD-01] Domain Schemas & DB Integration #01

- **Operator $\Omega_{schema}$**: Defines the immutable matrix of valid data coordinates.
- **Subtasks**:
  - [ ] 1.1. Create `src/db/schemas.ts`.
  - [ ] 1.2. Define `SpecSchema` and `TddPlanSchema`.
  - [ ] 1.3. Update `src/db.ts` to use inferred types from the new schemas.

#### [TDD-02] JSON Repair Utility #02

- **Operator $\Omega_{repair}$**: Collapses dirty text spaces into clean JSON objects.
- **Subtasks**:
  - [ ] 2.1. Create `src/utils/json-repair.ts`.
  - [ ] 2.2. Implement `extractAndParseJSON`.
  - [ ] 2.3. Add fallback cascading logic.

---

### Phase 2: The Routing Engine

#### [TDD-03] AIEngine Core Implementation #03

- **Operator $\Omega_{engine}$**: The central router for semantic projections.
- **Subtasks**:
  - [ ] 3.1. Create `src/ai/engine.ts`.
  - [ ] 3.2. Define `AgnosticLlm` interface.
  - [ ] 3.3. Implement the `constructor` and basic `chat()` method.

#### [TDD-04] Structured Generation Router #04

- **Operator $\Omega_{route}$**: Dynamically negotiates the extraction path.
- **Subtasks**:
  - [ ] 4.1. Implement the premium route using Vercel AI SDK.
  - [ ] 4.2. Implement the agnostic fallback route using `extractAndParseJSON`.
  - [ ] 4.3. Ensure strict schema parsing before returning.

---

### Phase 3: Business Logic (The Prompts)

#### [TDD-05] Clarification & Specification Operators #05

- **Operator $\Omega_{logic1}$**: Projects user goals into formal specifications.
- **Subtasks**:
  - [ ] 5.1. Create `src/ai/index.ts`.
  - [ ] 5.2. Implement `clarifyGoal(goal, engine)` using `engine.chat()`.
  - [ ] 5.3. Implement `generateSpec(goal, constitution, engine)` using `generateStructured`.

#### [TDD-06] TDD Architecture Operator #06

- **Operator $\Omega_{logic2}$**: Projects specifications into exact test plans.
- **Subtasks**:
  - [ ] 6.1. Implement `generateTddPlan(spec, constitution, engine)`.
  - [ ] 6.2. Bind inputs to `TddPlanSchema`.

---

### Phase 4: Integrations (OpenCode & CLI Harness)

#### [TDD-07] Native OpenCode Plugin #07

- **Operator $\Omega_{plugin}$**: The entry point for the OpenCode ecosystem.
- **Subtasks**:
  - [ ] 7.1. Run `npm install @opencode-ai/plugin`.
  - [ ] 7.2. Create `src/opencode-plugin.ts`.
  - [ ] 7.3. Implement `cliUseTddPlugin` and register `generate_tdd_plan` tool.

#### [TDD-08] CLI Test Harness Adaptation #08

- **Operator $\Omega_{harness}$**: The local validation loop for developers.
- **Subtasks**:
  - [ ] 8.1. Update `src/index.tsx` to instantiate `AIEngine`.
  - [ ] 8.2. Create a mock wrapper to map the CLI's selected model into the `AgnosticLlm` interface.
  - [ ] 8.3. Connect the CLI phases to the new `src/ai/index.ts` functions.
  - [ ] 8.4. Ensure CLI remains open at the `done` state instead of exiting.
