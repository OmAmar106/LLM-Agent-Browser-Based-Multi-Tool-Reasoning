# LLM-Agent-Browser-Based-Multi-Tool-Reasoning

A **minimal JavaScript-based LLM agent** that can query a language model, execute code, and call external tools like Google Search, all from the browser. Designed as a **proof-of-concept** for multi-tool AI reasoning.

---

## Features

- Query different LLMs (OpenAI GPT-4 Turbo, Claude 3.5, Gemini, LLaMA, etc.)
- Execute JavaScript safely in a sandbox (`runSandboxedJS`)
- Fetch search results using Google Custom Search (`GoogleSearch`)
- Support multi-step tool reasoning and combine outputs
- Browser-based chat UI with:
  - Code block formatting
  - Clickable links
  - Multi-line messages
- Easily deployable backend with Node.js + Express or serverless API routes

---

## Screenshots

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/LLM-Agent-Browser-Based-Multi-Tool-Reasoning.git
cd LLM-Agent-Browser-Based-Multi-Tool-Reasoning
````

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```env
AI_PIPE_KEY=your_llm_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX=your_custom_search_engine_id
```

---

## Running Locally

```bash
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

1. Type a message in the chat input.
2. The agent will automatically:

   * Decide which tool(s) to use (`runSandboxedJS`, `GoogleSearch`, or LLM call)
   * Execute and combine results
3. Messages appear with proper formatting:

   * Code blocks are highlighted
   * URLs are clickable

---

## Tools Supported

* `runSandboxedJS` → Executes JS code safely
* `GoogleSearch` → Queries Google Custom Search
* `llm_call` → Queries your chosen LLM
* Multi-step reasoning supported