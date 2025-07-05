const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: String,
  sourceType: String,
  sourcePath: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: Date,
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  departments: [String],
  fileType: String,
  summary: String,
  metadata: {
    originalFileName: String,
    size: Number,
    contentType: String
  },
  embeddingLocation: {
    type: {
      type: String, // 'chroma', 'pinecone', 'qdrant', etc.
      // required: true
    },
    path: String,         // e.g., "vector_dbs/<doc_id>" for Chroma
    index: String,        // e.g., Pinecone index name
    namespace: String     // e.g., doc_id
  }
});

module.exports = mongoose.model('Document', documentSchema);
