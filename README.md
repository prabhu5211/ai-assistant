# AI-Powered Support Assistant

A full-stack application that provides an AI-powered support assistant capable of answering questions based on product documentation.

## Tech Stack

- **Frontend**: React.js (Vite)
- **Backend**: Node.js (Express)
- **Database**: SQLite (better-sqlite3)
- **LLM**: Configurable (OpenAI/Gemini/Claude/Mistral)

## Features

✅ Chat interface with session management
✅ Document-based answering (no hallucinations)
✅ Conversation persistence in SQLite
✅ Context-aware responses (last 5 message pairs)
✅ Rate limiting per IP
✅ Session history management
✅ Responsive UI with loading states

## Project Structure

```
/backend
  - server.js          # Express server setup
  - db.js              # SQLite database initialization
  - routes/chat.js     # API endpoints
  - docs.json          # Product documentation
  - package.json

/frontend
  - src/
    - App.jsx          # Main app component
    - components/
      - ChatScreen.jsx # Chat UI
    - services/
      - api.js         # API client
    - utils/
      - session.js     # Session management
  - package.json
```

## Database Schema

### sessions
| Column     | Type     | Notes                |
|------------|----------|----------------------|
| id         | TEXT     | Primary Key (UUID)   |
| created_at | DATETIME | Auto-generated       |
| updated_at | DATETIME | Auto-updated         |

### messages
| Column     | Type     | Notes                          |
|------------|----------|--------------------------------|
| id         | INTEGER  | Primary Key (autoincrement)    |
| session_id | TEXT     | Foreign Key to sessions        |
| role       | TEXT     | "user" or "assistant"          |
| content    | TEXT     | Message content                |
| created_at | DATETIME | Auto-generated                 |

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
copy .env.example .env
```

4. Add your LLM API key to `.env`:
```
LLM_API_KEY=your_actual_api_key
LLM_PROVIDER=openai
```

5. Start the server:
```bash
npm start
```

Backend runs on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## API Documentation

### POST /api/chat
Send a message to the assistant.

**Request:**
```json
{
  "sessionId": "session_123",
  "message": "How can I reset my password?"
}
```

**Response:**
```json
{
  "reply": "Users can reset password from Settings > Security...",
  "tokensUsed": 123
}
```

### GET /api/conversations/:sessionId
Retrieve all messages for a session.

**Response:**
```json
{
  "sessionId": "session_123",
  "messages": [
    {
      "role": "user",
      "content": "How can I reset my password?",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### GET /api/sessions
List all sessions.

**Response:**
```json
{
  "sessions": [
    {
      "id": "session_123",
      "lastUpdated": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## LLM Integration

The assistant is configured to answer ONLY from the provided documentation in `docs.json`. 

**Important**: You need to implement the actual LLM API call in `backend/routes/chat.js` in the `callLLM` function. The current implementation is a placeholder.

Example for OpenAI (uncomment and modify in chat.js):
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }]
  })
});
```

## Key Implementation Details

1. **Session Management**: Sessions are generated client-side using timestamp + random string, stored in localStorage
2. **Context Window**: Last 5 user+assistant message pairs are sent to LLM for context
3. **Document-Only Responses**: System prompt enforces strict adherence to docs.json content
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **Error Handling**: All endpoints return clean JSON errors

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options

**Option 1: Render + Vercel (Recommended)**
- Backend: Deploy to Render (free tier)
- Frontend: Deploy to Vercel (free tier)
- See DEPLOYMENT.md for step-by-step guide

**Option 2: Railway**
- Full-stack deployment on Railway
- Single platform for both frontend and backend

**Option 3: Local Network**
- Demo on your local network
- No external hosting needed

## Assumptions

- Single-user application (no authentication)
- Sessions are identified by client-generated IDs
- All documentation fits in a single LLM context window
- Rate limiting is IP-based (suitable for development/demo)

## Future Enhancements (Bonus)

- [ ] Embeddings + similarity search for large documentation
- [ ] Docker containerization
- [ ] Unit tests
- [ ] Markdown rendering in chat
- [ ] Deployment configuration

## License

MIT
