---
allowed-tools: Bash(node, npx, tsx)
---

# OpenCode CLI-Use Skill Definition

This plugin adds dual persona agents (Planner & Implementer) to manage full TDD lifecycles using structured JSON plans.

## Capabilities

- **State Injection:** Enforces strict execution sequence by saving architecture plans to the local filesystem (`cli-use/changes/latest/plan.json`).
- **Stateless Background Validation:** Pre-verifies tool inputs (Edit, Write) for architectural violations like usage of `console.log`.

## Tools

To save the TDD plan, use Bash to invoke the internal Node script:
`npx tsx .claude-plugin/save_plan.ts`

The planner is restricted from executing arbitrary shell commands and must use `save_plan` exclusively to progress the feature lifecycle.
