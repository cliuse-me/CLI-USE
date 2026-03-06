import { JSONFilePreset } from 'lowdb/node';
import { z } from 'zod';

// --- SCHEMAS ---
export const SpecSchema = z.object({
    overview: z.string(),
    features: z.array(z.string()),
    techStack: z.array(z.string()),
});

export const PlanSchema = z.object({
    steps: z.array(z.object({
        id: z.string(),
        title: z.string(),
        command: z.string().optional(),
        file: z.string().optional()
    }))
});

// --- STATE INTERFACE ---
export interface AppState {
    goal: string;
    status: 'idle' | 'spec' | 'plan' | 'done';
    spec: z.infer<typeof SpecSchema> | null;
    plan: z.infer<typeof PlanSchema> | null;
}

// --- INIT DB ---
const defaultData: AppState = {
    goal: '',
    status: 'idle',
    spec: null,
    plan: null
};

export const getDb = async () => {
    // Saves to .planning/db.json automatically
    return await JSONFilePreset<AppState>('.planning/db.json', defaultData);
};