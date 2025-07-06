const ChatModel = require('../../model/chat')
const axios = require('axios');
const user = require('../../model/user');

const fetchChat = async (req, res) => {
    try {
        // console.log('fetchChat called');
        // console.log(req.user._id)
        const chat = await ChatModel.find({ userId: req.user._id })
        console.log(chat)
        res.status(200).json(chat)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}


const queryReply = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text, documentIds } = req.body;

    if (!text || !documentIds || documentIds.length === 0) {
      return res.status(400).json({ error: 'Missing text or document IDs' });
    }

    let chat = await ChatModel.findOne({ userId });
    if (!chat) {
      chat = new ChatModel({ userId, messages: [] });
    }

    chat.messages.push({
      sender: 'user',
      text,
      documentIds,
      timestamp: new Date()
    });

    await chat.save();

    try {
      const flaskRes = await axios.post('http://localhost:5000/query', {
        question: text,
        document_ids: documentIds
      });

      const botReply = flaskRes.data.answer;

      chat.messages.push({
        sender: 'bot',
        text: botReply,
        documentIds,
        timestamp: new Date()
      });

      await chat.save();

      return res.json({ reply: botReply });
    } catch (flaskErr) {
      console.error('Flask error:', flaskErr.message);
      return res.status(500).json({ error: 'Flask model service error' });
    }
  } catch (err) {
    console.error('Node backend error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { fetchChat, queryReply };