import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { llm_call } from './app/llmcall.js';
import { runSandboxedJS, generateAgentResponse, GoogleSearch } from './app/tools.js';


const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'app')));

let apikey1 = process.env.AI_PIPE_KEY || null;

app.post('/set-api-key', (req, res) => {
  const { apiKey } = req.body;
  if (apiKey && apiKey.trim() !== '') {
    apikey1 = apiKey;
  }
  res.sendStatus(200);
});

app.post('/api/agent', async (req, res) => {
  const { message, model } = req.body;

  const apiKeys = [
    apikey1,
    process.env.AI_PIPE_API_KEY,
    process.env.AI_PIPE_API_KEY1,
    process.env.AI_PIPE_API_KEY2,
    process.env.AI_PIPE_API_KEY3,
    process.env.AI_PIPE_API_KEY4
  ].filter(Boolean); // remove null/undefined

  let reply = null;
  let lastError = null;

  for (const key of apiKeys) {
    try {
      reply = await generateAgentResponse(
        message,
        key,
        process.env.GOOGLE_API_KEY,
        model,
        process.env.GOOGLE_CX
      );
      break;
    } catch (err) {
      lastError = err;
      // console.warn(`API key failed, trying next: ${key}`);
    }
  }

  if (reply) {
    res.json({ reply });
  } else {
    console.error(lastError);
    res.status(500).json({ error: 'All API keys failed' });
  }
});


app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
