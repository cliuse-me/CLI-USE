#!/usr/bin/env node
import "dotenv/config";
import React from "react";
import { render, Box, Text } from "ink";

const App = () => (
  <Box padding={1} borderStyle="round" borderColor="green">
    <Text color="green">CLI Use TDD (BYOM Refactoring in progress)</Text>
  </Box>
);

const app = render(<App />);
app.waitUntilExit().catch(console.error);
