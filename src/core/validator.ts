/**
 * A stateless validation engine (The "Silent Guardian").
 * Enforces specific codebase policies before allowing file changes to be applied.
 * Currently, it restricts the use of `console.log` statements in generated code.
 *
 * @param code - The string content of the code to be evaluated.
 * @returns True if the code passes validation, false otherwise.
 */
export function validateCode(code: string): boolean {
  return !code.includes("console.log");
}
