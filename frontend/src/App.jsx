import { useState, useEffect } from 'react';
import ChatScreen from './components/ChatScreen';
import { generateSessionId, getSessionId, setSessionId } from './utils/session';
import './App.css';

function App() {
  const [sessionId, setCurrentSessionId] = useState('');

  useEffect(() => {
    let id = getSessionId();
    if (!id) {
      id = generateSessionId();
      setSessionId(id);
    }
    setCurrentSessionId(id);
  }, []);

  const handleNewChat = () => {
    const newId = generateSessionId();
    setSessionId(newId);
    setCurrentSessionId(newId);
    window.location.reload();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Support Assistant</h1>
        <button onClick={handleNewChat} className="new-chat-btn">
          New Chat
        </button>
      </header>
      {sessionId && <ChatScreen sessionId={sessionId} />}
    </div>
  );
}

export default App;
