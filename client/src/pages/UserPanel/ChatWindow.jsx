import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './styles/ChatWindow.module.scss';
import { SummaryApi } from '../../common';

const ChatWindow = ({ selectedDocs }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Fetch chat history on mount
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await axios.get(SummaryApi.FetchChat.url, { withCredentials: true });
        // console.log('chatHsitory1 ', res.data)
        if (Array.isArray(res.data) && res.data.length > 0) {
          setChatHistory(res.data[0].messages || []);
        } else {
          setChatHistory([]);
        }

      } catch (err) {
        console.error('Error fetching chat:', err);
      }
    };
    // console.log('chatHistory', chatHistory)
    fetchChat();
  }, []);

  // 2. Send new query
  const handleSend = async () => {
    if (!input.trim() || selectedDocs.length === 0) return;
    console.log("selectedDocs =", selectedDocs);
    const userMessage = {
      sender: 'user',
      text: input,
      documentIds: selectedDocs,
    };

    // Optimistically add user message
    setChatHistory((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    console.log('userMessage', userMessage);
    try {
      const res = await axios.post(
        SummaryApi.QueryReply.url,
        {
          text: userMessage.text,
          documentIds: userMessage.documentIds,
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
      <div className={styles.chatHistory}>
        <h3 className={styles.chatTitle}>Chat History</h3>
        <div className={styles.chatBox}>
          {chatHistory.length === 0 && <p style={{ color: 'gray' }}>No chat history found.</p>}

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

      </div>

      <div className={styles.chatInputSection}>
        <div className={styles.docSelect}>
          <strong>Using:</strong>{' '}
          {selectedDocs.length > 0
            ? selectedDocs.join(', ')
            : 'No document selected'}
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
  );
};

export default ChatWindow;