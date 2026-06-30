const express = require('express');
const cors = require('cors');
const path = require('path');
const { buildAnswer, readKnowledgeBase } = require('./rag-engine');

const app = express();
const PORT = process.env.PORT || 3001;
const rootDir = __dirname;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(rootDir, 'public_html')));

app.get('/health', (_, res) => {
  res.json({ ok: true, service: 'scientific-rag-chatbot' });
});

app.post('/api/chat', (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Please provide a question.' });
    }

    const documents = readKnowledgeBase(rootDir);
    const result = buildAnswer(message, documents);
    res.json({
      reply: result.answer,
      language: result.language,
      sources: result.sources
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Scientific RAG backend running on http://localhost:${PORT}`);
});
