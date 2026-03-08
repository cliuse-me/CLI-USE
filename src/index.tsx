#!/usr/bin/env node
import "dotenv/config";
import React, { useState, useEffect } from "react";
import { render, Box, Text, useApp } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { getDb } from "./db";
import { ModelSelector } from "./ui/ModelSelector";
import { ModelConfig, ProviderMissingError, getModel } from "./lib/models";
import { generateText } from "ai";
import { AIEngine } from "./ai/engine";

const initialGoal = process.argv.slice(2).join(" ");

const PlannerApp = () => {
  const [db, setDb] = useState<any>(null);
  const [activeModel, setActiveModel] = useState<ModelConfig | null>(null);

  const [input, setInput] = useState(initialGoal || "");
  const [isThinking, setIsThinking] = useState(false);
  const [missingPkg, setMissingPkg] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const database = await getDb();
      if (initialGoal) {
        database.data.goal = initialGoal;
        database.data.status = "idle";
        await database.write();
      }
      setDb(database);
    })();
  }, []);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  // Builds the new AIEngine logic injecting the CLI's selected model as the AgnosticLLM
  const createEngine = async (modelConfig: ModelConfig) => {
    // We treat whatever the user selects in the CLI as the "Agnostic" LLM.
    const baseModel = await getModel(modelConfig);

    const agnosticLlm = {
      generate: async (prompt: string) => {
        const { text } = await generateText({
          model: baseModel,
          prompt,
        });
        return { text };
      },
    };

    // If the user selected the Gemini 2.0 Flash explicitly, we pass the key.
    // Otherwise, we intentionally omit it so the Engine tests the Agnostic fallback route.
    const isPremiumSelected = modelConfig.modelId === "gemini-2.0-flash";
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    return new AIEngine(agnosticLlm, { gemini: isPremiumSelected ? geminiKey : undefined });
  };

  const runSpecPhase = async (database: any, modelConfig: ModelConfig) => {
    setIsThinking(true);
    addLog("📝 Generating Specifications...");
    try {
      const engine = await createEngine(modelConfig);
      const { generateSpec } = await import("./ai/index");
      const spec = await generateSpec(
        database.data.goal,
        "Strictly adhere to Test-Driven Development.",
        engine,
      );
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
      const engine = await createEngine(modelConfig);
      const { generateTddPlan } = await import("./ai/index");
      const plan = await generateTddPlan(
        database.data.spec,
        "Strictly adhere to Test-Driven Development.",
        engine,
      );
      database.data.plan = plan;
      database.data.status = "done";
      await database.write();

      addLog("✔ TDD Plan Saved to .planning/db.json");
      setIsThinking(false);
      // REMOVED exit() here so the CLI stays open!
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

  // Allow resetting the state from the done screen to start a new plan
  useApp();
  useEffect(() => {
    const handleKeyPress = (_ch: any, key: any) => {
      if (db?.data?.status === "done" && (key.name === "r" || key.name === "R")) {
        setLog([]);
        db.data.status = "idle";
        db.data.goal = "";
        db.write();
        setDb({ ...db }); // force re-render
      }
    };
    process.stdin.on("keypress", handleKeyPress);
    return () => {
      process.stdin.removeListener("keypress", handleKeyPress);
    };
  }, [db]);

  useEffect(() => {
    if (!db || !activeModel || initialGoal) return;
    if (db.data.status === "spec" && !isThinking) {
      runSpecPhase(db, activeModel);
    } else if (db.data.status === "plan" && !isThinking) {
      runPlanPhase(db, activeModel);
    }
  }, [db, activeModel]);

  const handleModelSelect = async (config: ModelConfig) => {
    setActiveModel(config);
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
          <Text> Total test files planned: {db.data.plan?.testFilesToCreate?.length || 0} </Text>
          <Text> Press [R] to start a new plan, or [Ctrl+C] to exit. </Text>
        </Box>
      )}
    </Box>
  );
};

const app = render(<PlannerApp />);
app.waitUntilExit().catch(console.error);
