import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './styles/ChatWindow.module.scss';
import { SummaryApi } from '../../common';

const ChatWindow = ({ selectedDocs }) => {
  const [chatList, setChatList] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Fetch all chat sessions
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(SummaryApi.FetchChat.url, { withCredentials: true });
        setChatList(res.data || []);
        if (res.data.length > 0) {
          setSelectedChatId(res.data[0]._id); // auto-select first chat
        }
      } catch (err) {
        console.error('Error fetching chat list:', err);
      }
    };
    fetchChats();
  }, []);

  // 2. Load messages of selected chat
  useEffect(() => {
    const fetchChatMessages = async () => {
      if (!selectedChatId) return;
      try {
        const res = await axios.get(`${SummaryApi.FetchChat.url}/${selectedChatId}`, {
          withCredentials: true
        });
        console.log('Fetched chat messages:', res.data);
        setChatHistory(res.data?.messages || []);
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      }
    };
    fetchChatMessages();
  }, [selectedChatId]);

  // 3. Start a new chat
  const createNewChat = async () => {
    try {
      const res = await axios.post(SummaryApi.NewChat.url, {}, { withCredentials: true });
      const newChat = res.data;
      setChatList((prev) => [newChat, ...prev]);
      setSelectedChatId(newChat._id);
      setChatHistory([]);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  // 4. Send new message
  const handleSend = async () => {
    if (!input.trim() || selectedDocs.length === 0 || !selectedChatId) return;

    const userMessage = {
      sender: 'user',
      text: input,
      documentIds: selectedDocs,
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        SummaryApi.QueryReply.url,
        {
          text: userMessage.text,
          documentIds: userMessage.documentIds,
          chatId: selectedChatId,
        },
        { withCredentials: true }
      );

      const botMessage = {
        sender: 'bot',
        text: res.data.reply,
        documentIds: userMessage.documentIds,
      };

      setChatHistory((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Error during chat:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.chatWrapper}>
      {/* Sidebar for chat list */}
      <div className={styles.chatSidebar}>
        <h3 className={styles.sidebarTitle}>Your Chats</h3>

        <button className={styles.newChatButton} onClick={createNewChat}>
          + New Chat
        </button>

        {chatList.length === 0 && <p style={{ color: 'gray' }}>No chats found.</p>}
        {chatList.map((chat) => (
          <div
            key={chat._id}
            className={`${styles.chatItem} ${chat._id === selectedChatId ? styles.activeChat : ''}`}
            onClick={() => setSelectedChatId(chat._id)}
          >
            <strong>{chat.title || 'Untitled Chat'}</strong>
            <p className={styles.chatSummary}>
              {chat.summary?.slice(0, 40) || 'No summary yet...'}
            </p>
          </div>
        ))}
      </div>

      {/* Main Chat Window */}
      <div className={styles.chatHistory}>
        <h3 className={styles.chatTitle}>Chat Messages</h3>
        <div className={styles.chatBox}>
          {chatHistory.length === 0 && <p style={{ color: 'gray' }}>No messages in this chat.</p>}
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px',
                marginBottom: '10px',
                backgroundColor: msg.sender === 'user' ? '#005ccc' : '#333',
                color: '#fff',
                borderRadius: '6px',
                maxWidth: '70%',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
        </div>

        <div className={styles.chatInputSection}>
          <div className={styles.docSelect}>
            <strong>Using:</strong>{' '}
            {selectedDocs.length > 0 ? selectedDocs.join(', ') : 'No document selected'}
          </div>

          <div className={styles.inputRow}>
            <input
              type="text"
              value={input}
              placeholder="Ask a question..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
              className={styles.chatInput}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className={styles.sendButton}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
