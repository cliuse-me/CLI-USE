import { describe, it, expect, vi } from 'vitest';
import plugin from './index';
import * as state from '../core/state';

vi.mock('../core/state', () => ({
  getPlanState: vi.fn(),
}));

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

  it('registers /propose and /implement commands', async () => {
    const result = await plugin({} as any);
    const config: any = {};
    await result.config!(config);
    
    expect(config.command.propose).toBeDefined();
    expect(config.command.propose.agent).toBe('cli-use-planner');
    expect(config.command.implement).toBeDefined();
    expect(config.command.implement.agent).toBe('cli-use-implementer');
  });

  it('injects state into system prompt via chat.params', async () => {
    const result = await plugin({} as any);
    const output = { system: [] as string[] };
    
    const mockState = {
      proposal: 'Test Proposal',
      specs: 'Test Specs',
      design: 'Test Design',
      tasks: [{ id: '1', description: 'Test Task', status: 'pending' }]
    };
    vi.mocked(state.getPlanState).mockResolvedValue(mockState);

    // Simulate input with feature name in context or args
    await result['chat.params']!({ agent: 'cli-use-implementer' } as any, output as any);
    
    expect(output.system).toHaveLength(1);
    expect(output.system[0]).toContain('Test Proposal');
    expect(state.getPlanState).toHaveBeenCalledWith('latest');
  });

  it('blocks invalid tool execution in tool.execute.after', async () => {
    const result = await plugin({} as any);
    const output = { output: 'console.log("bad")' };
    await expect(result['tool.execute.after']!({ tool: 'Edit' } as any, output as any))
      .rejects.toThrow('Validation Failed');
  });
});
