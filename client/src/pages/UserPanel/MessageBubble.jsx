import React from 'react';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div
      className={`p-2 rounded max-w-[80%] ${
        isUser ? 'bg-blue-100 self-end text-right' : 'bg-gray-200 self-start'
      }`}
    >
      {message.content}
    </div>
  );
};

export default MessageBubble;
