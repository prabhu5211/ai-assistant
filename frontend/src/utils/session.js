export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getSessionId() {
  return localStorage.getItem('sessionId');
}

export function setSessionId(id) {
  localStorage.setItem('sessionId', id);
}
