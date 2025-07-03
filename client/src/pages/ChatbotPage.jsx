import React, { useState, useEffect, useRef } from 'react';

const ChatbotPage = ({ user, onLogout }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState('');
  const conversationRef = useRef();

  useEffect(() => {
    const initialChats = [
      { id: 1, title: 'API Authentication', messages: [
        { type: 'user', text: 'How do I auth with the V2 API?' },
        { type: 'bot', text: 'You need a JWT token...' },
      ] },
      { id: 2, title: 'Ticket INC-58291', messages: [
        { type: 'user', text: 'Resolution for ticket INC-58291?' },
        { type: 'bot', text: 'Restarted database service.' },
      ] }
    ];
    setChatHistory(initialChats);
    setActiveChatId(1);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    const message = { type: 'user', text: input };
    let updatedChats = [...chatHistory];
    let chat = updatedChats.find(c => c.id === activeChatId);

    if (!chat) {
      const newChat = {
        id: Date.now(),
        title: input.substring(0, 25) + '...',
        messages: [message]
      };
      updatedChats.unshift(newChat);
      setChatHistory(updatedChats);
      setActiveChatId(newChat.id);
    } else {
      chat.messages.push(message);
    }

    setInput('');
    setChatHistory(updatedChats);

    setTimeout(() => {
      const botResponse = { type: 'bot', text: 'This is a simulated response.' };
      const updatedChatsAfterBot = [...updatedChats];
      const currentChat = updatedChatsAfterBot.find(c => c.id === activeChatId);
      if (currentChat) currentChat.messages.push(botResponse);
      setChatHistory(updatedChatsAfterBot);
    }, 1000);
  };

  const renderMessages = () => {
    const chat = chatHistory.find(c => c.id === activeChatId);
    if (!chat) return <div className="chat-message bot-message">Ask me anything...</div>;
    return chat.messages.map((msg, i) => (
      <div key={i} className={`chat-message ${msg.type}-message`}>{msg.text}</div>
    ));
  };

  return (
    <div id="user-view">
      <div className="co-pilot-container">
        <aside className="history-sidebar">
          <button className="btn btn-secondary new-chat-btn" onClick={() => setActiveChatId(null)}>＋ New Chat</button>
          <ul className="history-list">
            {chatHistory.map(chat => (
              <li key={chat.id}>
                <a
                  href="#"
                  className={chat.id === activeChatId ? 'active' : ''}
                  onClick={e => { e.preventDefault(); setActiveChatId(chat.id); }}>
                  {chat.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>
        <div className="main-chat-view">
          <header className="co-pilot-header">
            <h2>Co-Pilot</h2>
            <button title="Logout" onClick={onLogout}>🚪 Logout</button>
          </header>
          <main className="conversation-area" ref={conversationRef}>{renderMessages()}</main>
          <footer className="input-area">
            <input
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyUp={e => e.key === 'Enter' && handleSend()}
            />
            <button className="btn btn-primary" onClick={handleSend}>➤</button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
