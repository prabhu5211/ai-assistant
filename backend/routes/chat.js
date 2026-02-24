import express from 'express';
import { prepare } from '../db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));
const docs = JSON.parse(readFileSync(join(__dirname, '../docs.json'), 'utf-8'));

// Helper: Get or create session
function ensureSession(sessionId) {
  const existing = prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);
  if (!existing) {
    prepare('INSERT INTO sessions (id) VALUES (?)').run(sessionId);
  }
  return sessionId;
}

// Helper: Save message
function saveMessage(sessionId, role, content) {
  prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(sessionId, role, content);
  prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId);
}

// Helper: Get recent context (last 5 pairs = 10 messages)
function getRecentContext(sessionId) {
  return prepare('SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 10')
    .all(sessionId)
    .reverse();
}

// Helper: Call LLM (supports OpenAI, Gemini, and Mock)
async function callLLM(userMessage, context, docsContent) {
  const provider = process.env.LLM_PROVIDER || 'mock';

  if (provider === 'gemini') {
    return callGemini(userMessage, context, docsContent);
  } else if (provider === 'openai') {
    return callOpenAI(userMessage, context, docsContent);
  } else if (provider === 'mock') {
    return callMock(userMessage, context, docsContent);
  }
  
  throw new Error('Invalid LLM_PROVIDER. Use "gemini", "openai", or "mock"');
}

// Mock implementation for testing (no API key needed)
function callMock(userMessage, context, docsContent) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Handle greetings
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some(greeting => lowerMessage.includes(greeting))) {
    return Promise.resolve({
      reply: "Hello! I'm your support assistant. I can help you with questions about password reset and refund policy. How can I assist you today?",
      tokensUsed: 0
    });
  }
  
  // Handle thanks
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return Promise.resolve({
      reply: "You're welcome! Is there anything else I can help you with?",
      tokensUsed: 0
    });
  }
  
  // Simple keyword matching against docs
  const docs = JSON.parse(readFileSync(join(__dirname, '../docs.json'), 'utf-8'));
  
  for (const doc of docs) {
    const keywords = doc.title.toLowerCase().split(' ');
    const contentKeywords = doc.content.toLowerCase();
    
    // Check if message contains keywords from title or content
    if (keywords.some(keyword => lowerMessage.includes(keyword)) || 
        (lowerMessage.includes('refund') && doc.title.includes('Refund')) ||
        (lowerMessage.includes('password') && doc.title.includes('Password'))) {
      return Promise.resolve({
        reply: doc.content,
        tokensUsed: 0
      });
    }
  }
  
  return Promise.resolve({
    reply: "Sorry, I don't have information about that. I can help you with: password reset and refund policy.",
    tokensUsed: 0
  });
}

// Gemini implementation (FREE)
async function callGemini(userMessage, context, docsContent) {
  const systemPrompt = `You are a support assistant. Answer ONLY based on the provided documentation below.
If the answer is not in the documentation, you MUST respond with: "Sorry, I don't have information about that."
Do not make up information or answer from general knowledge.

Documentation:
${docsContent}`;

  // Build conversation history
  let conversationText = systemPrompt + '\n\n';
  context.forEach(msg => {
    conversationText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
  });
  conversationText += `User: ${userMessage}\nAssistant:`;

  try {
    // Try the newer API format first
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.LLM_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: conversationText }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return {
      reply: data.candidates[0].content.parts[0].text,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to get response from AI. Please check your API key at https://aistudio.google.com/app/apikey');
  }
}

// OpenAI implementation
async function callOpenAI(userMessage, context, docsContent) {
  const systemPrompt = `You are a support assistant. Answer ONLY based on the provided documentation below.
If the answer is not in the documentation, you MUST respond with: "Sorry, I don't have information about that."
Do not make up information or answer from general knowledge.

Documentation:
${docsContent}`;

  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  context.forEach(msg => {
    messages.push({ role: msg.role, content: msg.content });
  });

  messages.push({ role: 'user', content: userMessage });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      reply: data.choices[0].message.content,
      tokensUsed: data.usage.total_tokens
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to get response from AI');
  }
}

// POST /api/chat
router.post('/chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    ensureSession(sessionId);
    saveMessage(sessionId, 'user', message);

    const context = getRecentContext(sessionId);
    const docsContent = docs.map(d => `${d.title}: ${d.content}`).join('\n\n');

    const { reply, tokensUsed } = await callLLM(message, context, docsContent);

    saveMessage(sessionId, 'assistant', reply);

    res.json({ reply, tokensUsed });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// GET /api/conversations/:sessionId
router.get('/conversations/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = prepare('SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC')
      .all(sessionId);
    
    res.json({ sessionId, messages });
  } catch (error) {
    console.error('Fetch conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// GET /api/sessions
router.get('/sessions', (req, res) => {
  try {
    const sessions = prepare('SELECT id, updated_at as lastUpdated FROM sessions ORDER BY updated_at DESC')
      .all();
    
    res.json({ sessions });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

export default router;
