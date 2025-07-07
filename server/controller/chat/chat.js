const ChatModel = require('../../model/chat')
const DocumentModel = require('../../model/document')
const axios = require('axios');
const user = require('../../model/user');
const SummaryAPI = require('../../common');

const fetchChat = async (req, res) => {
  try {
    const chats = await ChatModel.find({ userId: req.user._id }).select('_id title summary createdAt');
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fetchParticularChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const chatId = req.params.id
    const chat = await ChatModel.findOne({
      _id: chatId,
      userId: userId
    });
    console.log(chat);
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// const queryReply = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { text, documentIds } = req.body;

//     console.log(req.body);

//     if (!text || !documentIds || documentIds.length === 0) {
//       return res.status(400).json({ error: 'Missing text or document IDs' });
//     }

//     let chat = await ChatModel.findOne({ userId });
//     const db_paths=[]
//     for(let i=0;i<documentIds.length;i++){
//       doc=await DocumentModel.findById(documentIds[i])
//       db_paths.push(doc.embeddingLocation.path)
//     }
//     if (!chat) {
//       chat = new ChatModel({ userId, messages: [] });
//     }

//     chat.messages.push({
//       sender: 'user',
//       text,
//       documentIds,
//       timestamp: new Date()
//     });

//     await chat.save();

//     try {
//       const flaskRes = await axios.post(SummaryAPI.ChatReply.url, {
//         query: text,
//         db_paths
//       });

//       const botReply = flaskRes.data.answer;

//       chat.messages.push({
//         sender: 'bot',
//         text: botReply,
//         documentIds,
//         timestamp: new Date()
//       });

//       await chat.save();

//       return res.json({ reply: botReply });
//     } catch (flaskErr) {
//       console.error('Flask error:', flaskErr.message);
//       return res.status(500).json({ error: 'Flask model service error' });
//     }
//   } catch (err) {
//     console.error('Node backend error:', err.message);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };

const queryReply = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text, documentIds, chatId } = req.body;

    if (!text || !documentIds || documentIds.length === 0) {
      return res.status(400).json({ error: 'Missing text or document IDs' });
    }

    const db_paths = [];

    for (const id of documentIds) {
      const doc = await DocumentModel.findById(id);
      if (doc) db_paths.push(doc.embeddingLocation.path);
    }

    let chat;

    if (chatId) {
      // Existing chat
      chat = await ChatModel.findById(chatId);
      if (!chat) return res.status(404).json({ error: 'Chat not found' });
    } else {
      // New chat
      chat = new ChatModel({
        userId,
        title: `Chat ${new Date().toLocaleString()}`,
        messages: [],
        summary: ''
      });
    }

    // User message
    chat.messages.push({
      sender: 'user',
      text,
      documentIds,
      timestamp: new Date()
    });

    await chat.save();

    // Query LLM
    const flaskRes = await axios.post(SummaryAPI.ChatReply.url, {
      query: text,
      db_paths
    });

    const botReply = flaskRes.data.answer;

    // Bot message
    chat.messages.push({
      sender: 'bot',
      text: botReply,
      documentIds,
      timestamp: new Date()
    });

    await chat.save();

    return res.json({ reply: botReply, chatId: chat._id });
  } catch (err) {
    console.error('queryReply error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const createNewChat = async (req, res) => {
  try {
    const chat = new ChatModel({
      userId: req.user._id,
      title: `Chat ${new Date().toLocaleString()}`,
      messages: [],
      summary: ''
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    console.error('Failed to create chat:', err.message);
    res.status(500).json({ error: 'Failed to create chat' });
  }
};



module.exports = { fetchChat, queryReply, fetchParticularChat, createNewChat };