# Agent Instructions

## Git Protocols

**CRITICAL: NEVER commit changes to the repository autonomously.**
You must receive the explicit command "COMMIT TO GIT" from the user.
This command is valid **ONLY** for the current execution/response. Do not assume it applies to future actions or turns.

**DONT UNDER ANY CIRCUMSTANCE COMMIT CODE WITHOUT EXPLICIT PERMISSION.**
**Wait for the user to type "commit to git" or similar.**

## CI/CD Verification Protocol

Before pushing any changes to the remote repository, you **MUST** simulate the GitHub Actions workflow locally to ensure the build will pass. This prevents breaking the CI pipeline with dependency conflicts or build errors.

### **Mandatory Checks**

Run the following commands in order:

1.  **Verify Dependency Resolution**:
    Ensure `npm install` (or `npm ci`) runs without `ERESOLVE` errors. This catches peer dependency conflicts early.

    ```bash
    rm -rf node_modules package-lock.json && npm install
    ```

2.  **Verify Code Quality & Type Safety**:
    Run the full test suite (Linting, Building, and Type Checking). If any type errors are found, **fix them** before proceeding.
    ```bash
    npm run lint && npm run typecheck && npm run test
    ```

**Do NOT push** if any of these steps fail. Fix the issues locally first (e.g., resolving type errors or using `overrides` in `package.json` for dependency conflicts).

## Release Protocol

To create a new release (tagging, pushing, publishing to npm, and creating GitHub releases), use the automated release command.

### **Usage**

Simply run the following command in your terminal and follow the interactive prompts:

```bash
npm run release
```

### **What this does**

The `npm run release` command (powered by `np`) automatically handles the entire release lifecycle:

1.  **Prerequisite Check**: Runs `npm run lint` and `npm run build` (via the `test` script) to ensure quality and stability. If these fail, the release is aborted.
2.  **Version Bump**: Asks you for the new version (patch, minor, major).
3.  **Git Operations**: Creates a commit and a tag for the new version.
4.  **Publishing**: Pushes commits/tags to GitHub and publishes the package to `npm` (handling 2FA if enabled).
5.  **GitHub Release**: Creates a release on GitHub.

**Important:** You must be logged in to npm (`npm login`) before running this command.
