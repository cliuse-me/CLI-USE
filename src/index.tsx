#!/usr/bin/env node
import "dotenv/config";
import React, { useState, useEffect } from "react";
import { render, Box, Text, useApp } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { getDb } from "./db";
import { ModelSelector } from "./ui/ModelSelector";
import { ModelConfig, ProviderMissingError } from "./lib/models";

const initialGoal = process.argv.slice(2).join(" ");

const PlannerApp = () => {
  const { exit } = useApp();
  const [db, setDb] = useState<any>(null);
  const [activeModel, setActiveModel] = useState<ModelConfig | null>(null);

  const [input, setInput] = useState(initialGoal || "");
  const [isThinking, setIsThinking] = useState(false);
  const [missingPkg, setMissingPkg] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const database = await getDb();
      // If the user provided a CLI argument, reset the database to start fresh
      if (initialGoal) {
        database.data.goal = initialGoal;
        database.data.status = "idle";
        await database.write();
      }
      setDb(database);
    })();
  }, []);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const runSpecPhase = async (database: any, modelConfig: ModelConfig) => {
    setIsThinking(true);
    addLog("📝 Generating Specifications...");
    try {
      const { generateSpec } = await import("./ai");
      const spec = await generateSpec(database.data.goal, modelConfig);
      database.data.spec = spec;
      database.data.status = "plan";
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
      const { generateTddPlan } = await import("./ai");
      const plan = await generateTddPlan(database.data.spec, modelConfig);
      database.data.plan = plan;
      database.data.status = "done";
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
    if (err?.name === "ProviderMissingError" || err instanceof ProviderMissingError) {
      setMissingPkg(err.pkgName);
    } else {
      addLog(`❌ Error: ${err.message || err.toString()}`);
      db.data.status = "idle";
      db.write();
    }
  };

  const handleSubmit = async (goal: string, overrideModel?: ModelConfig) => {
    const modelToUse = overrideModel || activeModel;
    if (!db || !modelToUse || !goal.trim()) return;
    db.data.goal = goal;
    db.data.status = "spec";
    await db.write();
    setInput("");
    runSpecPhase(db, modelToUse);
  };

  // Handle resuming previous states if no initial goal was provided
  useEffect(() => {
    if (!db || !activeModel || initialGoal) return;

    if (db.data.status === "spec" && !isThinking) {
      runSpecPhase(db, activeModel);
    } else if (db.data.status === "plan" && !isThinking) {
      runPlanPhase(db, activeModel);
    }
  }, [db, activeModel]);

  // --- RENDER FLOW ---

  const handleModelSelect = async (config: ModelConfig) => {
    setActiveModel(config);

    // If an initial goal was passed and the app is idle, auto-submit!
    if (initialGoal && db && db.data.status === "idle") {
      await handleSubmit(initialGoal, config);
    }
  };

  if (!db) return <Text>Loading Database...</Text>;

  if (missingPkg) {
    return (
      <Box flexDirection="column" padding={1} borderStyle="round" borderColor="red">
        <Text bold color="red">
          ⚠️ Missing Provider Package{" "}
        </Text>
        <Text> You selected a model, but its SDK is not installed.</Text>
        <Box marginY={1} paddingX={2} borderStyle="single" borderColor="gray">
          <Text color="cyan"> npm install {missingPkg} </Text>
        </Box>
        <Text color="gray"> After installing, run the CLI again.</Text>
      </Box>
    );
  }

  if (!activeModel) {
    return <ModelSelector onSelect={handleModelSelect} />;
  }

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="green">
      <Text bold color="green">
        🤖 cli - use - tdd{" "}
      </Text>
      <Text color="gray"> Model: {activeModel.modelId} </Text>

      <Box flexDirection="column" marginY={1}>
        {log.map((l, i) => (
          <Text key={i}> {l} </Text>
        ))}
      </Box>

      {db.data.status === "idle" && !isThinking && (
        <Box>
          <Text color="green">➜ What should we build ? </Text>
          <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
        </Box>
      )}

      {isThinking && (
        <Box>
          <Text color="cyan">
            {" "}
            <Spinner type="dots" /> Thinking...
          </Text>
        </Box>
      )}

      {db.data.status === "done" && (
        <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="green">
          <Text bold color="green">
            🎉 TDD Plan Completed!{" "}
          </Text>
          <Text> File: .planning / db.json </Text>
          <Text> Tests to write: {db.data.plan?.testCases.length} </Text>
          <Text> Implementation steps: {db.data.plan?.implementationSteps.length} </Text>
        </Box>
      )}
    </Box>
  );
};

const app = render(<PlannerApp />);
await app.waitUntilExit();

