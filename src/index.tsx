#!/usr/bin/env node
import 'dotenv/config';
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { getDb } from './db';
import { ModelSelector } from './ui/ModelSelector';
import { ModelConfig, ProviderMissingError } from './lib/models';

const PlannerApp = () => {
    const { exit } = useApp();
    const [db, setDb] = useState<any>(null);
    const [activeModel, setActiveModel] = useState<ModelConfig | null>(null);

    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [missingPkg, setMissingPkg] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);

    useEffect(() => {
        (async () => {
            const database = await getDb();
            setDb(database);
            // If we resume mid-way, we don't need to ask for the model, 
            // but for safety in this demo, we'll wait for model selection first.
        })();
    }, []);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const runSpecPhase = async (database: any, modelConfig: ModelConfig) => {
        setIsThinking(true);
        addLog("📝 Generating Specifications...");
        try {
            const { generateSpec } = await import('./ai');
            const spec = await generateSpec(database.data.goal, modelConfig);
            database.data.spec = spec;
            database.data.status = 'plan';
            await database.write();

            addLog("✔ Spec Saved.");
            runPlanPhase(database, modelConfig);
        } catch (err: any) {
            handleAiError(err);
        }
    };

    const runPlanPhase = async (database: any, modelConfig: ModelConfig) => {
        setIsThinking(true);
        addLog("🧪 Generating TDD Architecture Plan...");
        try {
            const { generateTddPlan } = await import('./ai');
            const plan = await generateTddPlan(database.data.spec, modelConfig);
            database.data.plan = plan;
            database.data.status = 'done';
            await database.write();

            addLog("✔ TDD Plan Saved to .planning/db.json");
            setIsThinking(false);
            exit();
        } catch (err: any) {
            handleAiError(err);
        }
    };

    const handleAiError = (err: any) => {
        setIsThinking(false);
        if (err instanceof ProviderMissingError) {
            setMissingPkg(err.pkgName);
        } else {
            addLog(`❌ Error: ${err.message}`);
            exit();
        }
    };

    const handleSubmit = async (goal: string) => {
        if (!db || !activeModel) return;
        db.data.goal = goal;
        db.data.status = 'spec';
        await db.write();
        setInput('');
        runSpecPhase(db, activeModel);
    };

    // --- RENDER FLOW ---

    if (!db) return <Text>Loading Database...</Text>;

    if (missingPkg) {
        return (
            <Box flexDirection= "column" padding = { 1} borderStyle = "round" borderColor = "red" >
                <Text bold color = "red" >⚠️ Missing Provider Package </Text>
                    < Text > You selected a model, but its SDK is not installed.</Text>
                        < Box marginY = { 1} paddingX = { 2} borderStyle = "single" borderColor = "gray" >
                            <Text color="cyan" > npm install { missingPkg } </Text>
                                </Box>
                                < Text color = "gray" > After installing, run the CLI again.</Text>
                                    </Box>
    );
  }

if (!activeModel) {
    return <ModelSelector onSelect={ setActiveModel } />;
}

return (
    <Box flexDirection= "column" padding = { 1} borderStyle = "round" borderColor = "green" >
        <Text bold color = "green" >🤖 cli - use - tdd </Text>
            < Text color = "gray" > Model: { activeModel.modelId } </Text>

                < Box flexDirection = "column" marginY = { 1} >
                    { log.map((l, i) => <Text key={ i } > { l } </Text>) }
                    </Box>

{
    db.data.status === 'idle' && !isThinking && (
        <Box>
        <Text color="green" >➜ What should we build ? </Text>
            < TextInput value = { input } onChange = { setInput } onSubmit = { handleSubmit } />
                </Box>
      )
}

{
    isThinking && (
        <Box>
        <Text color="cyan" > <Spinner type="dots" /> Thinking...</Text>
            </Box>
      )
}

{
    db.data.status === 'done' && (
        <Box flexDirection="column" marginTop = { 1} borderStyle = "single" borderColor = "green" >
            <Text bold color = "green" >🎉 TDD Plan Completed! </Text>
                < Text > File: .planning / db.json </Text>
                    < Text > Tests to write: { db.data.plan?.testCases.length } </Text>
                        < Text > Implementation steps: { db.data.plan?.implementationSteps.length } </Text>
                            </Box>
      )
}
</Box>
  );
};

render(<PlannerApp />);