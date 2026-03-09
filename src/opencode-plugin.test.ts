import { describe, it, expect, vi } from 'vitest';

vi.mock('@opencode-ai/plugin', () => ({
  tool: (config: any) => config,
  Plugin: {}
}));

import { cliUseTddPlugin } from './opencode-plugin.js';
import * as db from './core/db.js';
import * as state from './core/state.js';

vi.mock('./core/db.js');
vi.mock('./core/state.js');

describe('cliUseTddPlugin', () => {
  it('returns a config with required agents and a save_plan tool', async () => {
    // @ts-ignore
    const hooks = await cliUseTddPlugin({});
    
    expect(hooks.config).toBeDefined();
    expect(hooks.tool).toBeDefined();
    expect(hooks.tool?.save_plan).toBeDefined();

    // Test config
    const cfg = { agent: {} };
    if (hooks.config) {
      await hooks.config(cfg as any);
    }
    
    // Check agents
    const agents = (cfg as any).agent;
    expect(agents['cli-use-planner']).toBeDefined();
    expect(agents['cli-use-planner'].permission?.edit).toBe('deny');
    expect(agents['cli-use-implementer']).toBeDefined();

    // Test tool
    const savePlanArgs = {
      proposal: "test proposal",
      specs: "test specs",
      design: "test design",
      tasks: [{ id: "1", description: "test task", status: "pending" }]
    };
    
    if (hooks.tool?.save_plan) {
      // @ts-ignore
      await hooks.tool.save_plan.execute(savePlanArgs, {} as any);
      expect(db.savePlan).toHaveBeenCalledWith('latest', savePlanArgs);
    }
  });

  it('injects plan state into system prompt for cli-use-implementer', async () => {
    // @ts-ignore
    const hooks = await cliUseTddPlugin({});
    expect(hooks['chat.params']).toBeDefined();

    const planState = {
      proposal: "prop",
      specs: "spec",
      design: "des",
      tasks: []
    };
    vi.mocked(state.getPlanState).mockResolvedValue(planState);

    const output: any = { system: "Original system." };
    
    // @ts-ignore
    await hooks['chat.params']({}, output, { activeAgentId: 'cli-use-implementer' });

    expect(state.getPlanState).toHaveBeenCalledWith('latest');
    expect(output.system).toContain('Original system.');
    expect(output.system).toContain('Latest Plan:');
    expect(output.system).toContain('"proposal": "prop"');

    const outputUndefined: any = {};
    // @ts-ignore
    await hooks['chat.params']({}, outputUndefined, { activeAgentId: 'cli-use-implementer' });
    expect(outputUndefined.system).toContain('Latest Plan:');
  });

  it('does not inject plan state for other agents', async () => {
    // @ts-ignore
    const hooks = await cliUseTddPlugin({});
    
    vi.mocked(state.getPlanState).mockResolvedValue(null);
    
    const output: any = { system: "Original system." };
    
    // @ts-ignore
    await hooks['chat.params']({}, output, { activeAgentId: 'cli-use-planner' });

    expect(output.system).toBe("Original system.");
  });

  it('throws an Error if edit tool provides invalid code', async () => {
    // @ts-ignore
    const hooks = await cliUseTddPlugin({});
    expect(hooks['tool.execute.after']).toBeDefined();

    const editInputInvalid = {
      tool: 'edit',
      args: { newString: 'console.log("hello");' }
    };

    // @ts-ignore
    await expect(hooks['tool.execute.after'](editInputInvalid)).rejects.toThrow('Code validation failed: console.log is not allowed');

    const editInputValid = {
      tool: 'edit',
      args: { newString: 'const a = 1;' }
    };
    // @ts-ignore
    await expect(hooks['tool.execute.after'](editInputValid)).resolves.toBeUndefined();
  });

  it('throws an Error if write tool provides invalid code', async () => {
    // @ts-ignore
    const hooks = await cliUseTddPlugin({});
    
    const writeInputInvalid = {
      tool: 'write',
      args: { content: 'console.log("world");' }
    };

    // @ts-ignore
    await expect(hooks['tool.execute.after'](writeInputInvalid)).rejects.toThrow('Code validation failed: console.log is not allowed');

    const writeInputValid = {
      tool: 'write',
      args: { content: 'const b = 2;' }
    };
    // @ts-ignore
    await expect(hooks['tool.execute.after'](writeInputValid)).resolves.toBeUndefined();
  });

  it('does not validate code for other tools', async () => {
    // @ts-ignore
    const hooks = await cliUseTddPlugin({});
    
    const otherToolInput = {
      tool: 'other',
      args: { someArg: 'console.log("not checked");' }
    };

    // @ts-ignore
    await expect(hooks['tool.execute.after'](otherToolInput)).resolves.toBeUndefined();
  });
});
