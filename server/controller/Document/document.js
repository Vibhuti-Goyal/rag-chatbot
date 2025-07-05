const Document = require('../../model/document');
const userModel = require('../../model/user');
const axios = require('axios');
const SummaryAPI = require('../../common');

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
        const flaskResponse = await axios.post(SummaryAPI.StoreVectorDB.url, {
          url,
          document_id: savedDoc._id,
          departments,
          file_type: fileType,
        });

        // Step 3: Update MongoDB with status + embedding location
        const { success, embedding_location, status, summary } = flaskResponse.data;

        // Step 3: Update MongoDB with status + embedding location + summary
        if (success && embedding_location) {
          await Document.findByIdAndUpdate(savedDoc._id, {
            status: status || 'completed',
            embeddingLocation: embedding_location,
            summary: summary || '',
          });
        } else {
          await Document.findByIdAndUpdate(savedDoc._id, {
            status: 'failed',
            summary: summary || '',
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



const fetchDocumentByRole = async (req, res) => {
  try {
    // console.log('fetchDocumentByRole called');
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if(user.role==="admin"){
        const documents = await Document.find();
        return res.status(200).json({ message: "Documents found", documents });
    }
    const role = user.department;
    const documents = await Document.find({ departments: role });

    res.status(200).json({ message: "Documents found", documents });
  } catch (err) {
    console.error('fetchDocumentByRole error:', err);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = { uploadUrls, fetchDocumentByRole };
