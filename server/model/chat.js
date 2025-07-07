// const mongoose = require('mongoose');

// const messageSchema = new mongoose.Schema({
//   sender: { type: String, enum: ['user', 'bot'], required: true },
//   text: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now },
//   documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
// });

// const chatSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   messages: [messageSchema]
// });

// module.exports = mongoose.model('Chat', chatSchema);


const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
});

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: '' },
  summary: { type: String, default: '' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);
