import { validateCode } from "../src/core/validator.js";

/**
 * Lightweight Node CLI wrapper for Claude Code hooks.json.
 * Validates tool arguments to ensure no invalid code (e.g. console.log) is passed.
 * Exits with status 2 if validation fails to block the action.
 */
async function main() {
  const chunks: Buffer[] = [];

  // Read all data from stdin
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  const payloadStr = Buffer.concat(chunks).toString("utf-8").trim();

  if (!payloadStr) {
    // If there is no payload, nothing to validate
    process.exit(0);
  }

  let codeToValidate = "";

  try {
    const data = JSON.parse(payloadStr);

    // Check known argument properties for Claude Code's Edit/Write tools
    if (data.newString) {
      codeToValidate = data.newString;
    } else if (data.content) {
      codeToValidate = data.content;
    } else if (data.file_content) {
      codeToValidate = data.file_content;
    } else if (data.new_str) {
      codeToValidate = data.new_str;
    }
  } catch {
    // If payload is not JSON, we can assume the raw payload might be the code itself
    codeToValidate = payloadStr;
  }

  if (codeToValidate && !validateCode(codeToValidate)) {
    console.error("Validation Failed: console.log is not allowed in generated code.");
    // Exit with code 2 to block the tool execution
    process.exit(2);
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
