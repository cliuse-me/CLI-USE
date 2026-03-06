# cli-use-tdd

An Agentic Planning and TDD (Test-Driven Development) CLI tool.

Built with **React**, **Ink**, and the **Vercel AI SDK**, this tool acts as your automated Tech Lead. It generates strict Product Requirements (Specs), Test Plans, and Implementation Steps _before_ you write a single line of code, preventing AI hallucinations and saving hours of debugging.

## ✨ Features

- **Bring Your Own Model (BYOM):** We don't lock you into a single provider. Use OpenAI, Anthropic, Google Gemini, Groq, or local models via Ollama.
- **Dynamic Loading:** We keep our core package tiny. You only install the AI SDKs you actually use.
- **Markdown-as-State:** All plans are saved locally to `.planning/db.json` so you never lose context.
- **Multi-Key Rotation:** Automatically round-robins Google API keys to bypass rate limits on free tiers.

---

## 🤖 Supported Models & Providers

Because `cli-use-tdd` uses dynamic imports, you only need to install the provider package for the model you intend to use.

Choose your preferred provider from the table below, install the package, and add the corresponding key to your `.env` file.

| Provider / Model                  | NPM Package Required | Environment Variable | Best For                                                             |
| :-------------------------------- | :------------------- | :------------------- | :------------------------------------------------------------------- |
| **Anthropic** (Claude 3.7 Sonnet) | `@ai-sdk/anthropic`  | `ANTHROPIC_API_KEY`  | **Complex TDD & Coding.** Currently the industry best for reasoning. |
| **OpenAI** (GPT-4o)               | `@ai-sdk/openai`     | `OPENAI_API_KEY`     | **Reliability & Speed.** The standard balanced choice.               |
| **Google** (Gemini 1.5 Pro)       | `@ai-sdk/google`     | `GOOGLE_API_KEYS`\*  | **Massive Context.** Can read your entire codebase (2M tokens).      |
| **Groq** (Llama 3 70B)            | `@ai-sdk/groq`       | `GROQ_API_KEY`       | **Ultra-Fast Generation.** Best for rapid prototyping.               |
| **Ollama** (Local Models)         | `ollama-ai-provider` | _None required_      | **Privacy & Free Usage.** Runs 100% locally on your machine.         |

_\* `GOOGLE_API_KEYS` supports multiple keys separated by commas (e.g., `key1,key2`) for automatic rate-limit bypassing._

---

## 🚀 Installation & Quick Start

**1. Install the CLI globally**

```bash
npm install -g cli-use-tdd
```
