const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function sendMessage(sessionId, message) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message })
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
}

export async function getConversation(sessionId) {
  const response = await fetch(`${API_BASE}/conversations/${sessionId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch conversation');
  }

  return response.json();
}

export async function getSessions() {
  const response = await fetch(`${API_BASE}/sessions`);

  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }

  return response.json();
}
