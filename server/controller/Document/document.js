const Document = require('../../model/document');
const axios = require('axios');

const uploadUrls = async (req, res) => {
  try {
    const { file_urls, file_types, departments } = req.body;
    const uploadedBy = req.user._id;

    if (
      !Array.isArray(file_urls) ||
      !Array.isArray(file_types) ||
      file_urls.length !== file_types.length ||
      !Array.isArray(departments)
    ) {
      return res.status(400).json({ message: 'Invalid input arrays' });
    }

    const createdDocs = [];

    for (let i = 0; i < file_urls.length; i++) {
      const url = file_urls[i];
      const fileType = file_types[i];

      // Step 1: Create & Save Document with status 'processing'
      const doc = new Document({
        title: url.slice(0, 100),
        sourceType: 'url',
        sourcePath: url,
        uploadedBy,
        uploadedAt: new Date(),
        status: 'processing',
        departments,
        fileType,
        metadata: {
          originalFileName: url,
          contentType: 'text/html',
          size: 0,
        },
      });

      const savedDoc = await doc.save();
      createdDocs.push(savedDoc);

      // Step 2: Send to Flask for processing
      try {
        const flaskResponse = await axios.post('http://localhost:5000/process_url', {
          url,
          document_id: savedDoc._id,
          departments,
          file_type: fileType,
        });

        const { success, embedding_location, status } = flaskResponse.data;

        // Step 3: Update MongoDB with status + embedding location
        if (success && embedding_location) {
          await Document.findByIdAndUpdate(savedDoc._id, {
            status: status || 'completed',
            embeddingLocation: embedding_location,
          });
        } else {
          await Document.findByIdAndUpdate(savedDoc._id, {
            status: 'failed',
          });
        }

      } catch (flaskError) {
        console.error(`Flask error for document ${savedDoc._id}:`, flaskError.message);
        await Document.findByIdAndUpdate(savedDoc._id, { status: 'failed' });
      }
    }

    return res.status(200).json({
      message: 'Documents sent for processing',
      data: createdDocs,
    });

  } catch (err) {
    console.error('uploadUrls error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { uploadUrls };
