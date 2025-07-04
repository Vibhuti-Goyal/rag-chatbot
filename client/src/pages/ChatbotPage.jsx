import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './ChatbotPage.module.scss';

const ChatbotPage = ({ user, onLogout }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState('');
  const [searchMode, setSearchMode] = useState('current'); // "current" or "all"
  const conversationRef = useRef();

  useEffect(() => {
    const initialChats = [];
    setChatHistory(initialChats);
    setActiveChatId(null);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user', text: input };
    const updatedChats = [...chatHistory];
    let chat = updatedChats.find(c => c.id === activeChatId);

    if (!chat) {
      const newChat = {
        id: Date.now(),
        title: input.substring(0, 25) + '...',
        messages: [userMessage],
      };
      updatedChats.unshift(newChat);
      setChatHistory(updatedChats);
      setActiveChatId(newChat.id);
    } else {
      chat.messages.push(userMessage);
    }

    setInput('');
    setChatHistory(updatedChats);

    try {
      const res = await axios.post('http://127.0.0.1:5000/ask', {
        question: input,
        search_mode: searchMode
      });

      const botMessage = {
        type: 'bot',
        text: res.data.answer || "🤖 I don't have an answer for that."
      };

      const updatedChatsAfterBot = [...updatedChats];
      const currentChat = updatedChatsAfterBot.find(c => c.id === (chat?.id || activeChatId));
      if (currentChat) currentChat.messages.push(botMessage);

      setChatHistory(updatedChatsAfterBot);
    } catch (error) {
      const errorMessage = {
        type: 'bot',
        text: `❌ Error: ${error.response?.data?.error || error.message}`
      };

      const updatedChatsAfterError = [...updatedChats];
      const currentChat = updatedChatsAfterError.find(c => c.id === (chat?.id || activeChatId));
      if (currentChat) currentChat.messages.push(errorMessage);

      setChatHistory(updatedChatsAfterError);
    }
  };

  const renderMessages = () => {
    const chat = chatHistory.find(c => c.id === activeChatId);
    if (!chat) return <div className={`${styles.chatMessage} ${styles.botMessage}`}>Ask me anything...</div>;
    return chat.messages.map((msg, i) => (
      <div key={i} className={`${styles.chatMessage} ${styles[`${msg.type}Message`]}`}>{msg.text}</div>
    ));
  };

  return (
    <div className={styles.userView}>
      <div className={styles.coPilotContainer}>
        <aside className={styles.historySidebar}>
          <button 
            className={`${styles.btn} ${styles.btnSecondary} ${styles.newChatBtn}`} 
            onClick={() => setActiveChatId(null)}
          >
            ＋ New Chat
          </button>
          <ul className={styles.historyList}>
            {chatHistory.map(chat => (
              <li key={chat.id}>
                <a
                  href="#"
                  className={chat.id === activeChatId ? styles.active : ''}
                  onClick={e => {
                    e.preventDefault();
                    setActiveChatId(chat.id);
                  }}
                >
                  {chat.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <div className={styles.mainChatView}>
          <header className={styles.coPilotHeader}>
            <h2>Co-Pilot</h2>
            <button title="Logout" onClick={onLogout}>🚪 Logout</button>
          </header>

          <main className={styles.conversationArea} ref={conversationRef}>
            {renderMessages()}
          </main>

          <footer className={styles.inputArea}>
            <select
              value={searchMode}
              onChange={e => setSearchMode(e.target.value)}
              className={styles.searchModeSelect}
            >
              <option value="current">Current</option>
              <option value="all">All</option>
            </select>

            <input
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyUp={e => e.key === 'Enter' && handleSend()}
              className={styles.messageInput}
            />
            <button 
              className={`${styles.btn} ${styles.btnPrimary}`} 
              onClick={handleSend}
            >
              ➤
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;