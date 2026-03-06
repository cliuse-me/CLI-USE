import { generateObject } from 'ai';
import { getModel, ModelConfig } from './lib/models';
import { SpecSchema, PlanSchema } from './db';

export async function generateSpec(goal: string, config: ModelConfig) {
    const model = await getModel(config);

    const { object } = await generateObject({
        model,
        schema: SpecSchema,
        prompt: `You are an expert Product Manager. Create a detailed product specification for the following goal: "${goal}".`
    });

    return object;
}

export async function generateTddPlan(spec: any, config: ModelConfig) {
    const model = await getModel(config);

    const { object } = await generateObject({
        model,
        schema: PlanSchema,
        prompt: `You are an expert Software Architect strict about Test-Driven Development (TDD).
             Given this specification: ${JSON.stringify(spec)}
             Create a test plan containing the unit tests that must be written first, followed by the implementation steps.`
    });

    return object;
}