import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { llm_call } from './app/llmcall.js';
import { runSandboxedJS, generateAgentResponse, GoogleSearch } from './app/tools.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'app')));

app.get('/api/env', (req, res) => {
  res.json({
    MY_VAR: process.env.MY_VAR || 'Not Set',
  });
});

app.post('/api/agent', async (req, res) => {
  const { message, model } = req.body;
  try {
    const reply = await generateAgentResponse(
      message,
      process.env.API_KEY,
      process.env.GOOGLE_API_KEY,
      model
    );
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
