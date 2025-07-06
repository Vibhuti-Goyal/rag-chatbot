import React, { useEffect, useState } from 'react';
import DocumentList from '../DocumentList/DocumentList';
import ChatWindow from './ChatWindow';
import DocumentModal from '../DocumentList/DocumentModel'; // Import the DocumentModal (note: DocumentModel not DocumentModal)
import axios from 'axios';
import { SummaryApi } from '../../common';
import styles from './styles/UserPanel.module.scss';

const UserPanel = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null); // State for modal

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await axios.get(SummaryApi.FetchDocumentByRole.url, {
          withCredentials: true,
        });
        setDocuments(res.data.documents);
      } catch (err) {
        console.error('Error fetching documents:', err);
      }
    };
    fetchDocs();
  }, []);

  // Function to handle document click for modal
  const handleDocumentClick = (document) => {
    setSelectedDocument(document);
  };

  // Function to close modal
  const handleCloseModal = () => {
    setSelectedDocument(null);
  };

  return (
    <div className={styles.userPanel}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.title}>Your Documents</h2>
          <div className={styles.documentCount}>
            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          </div>
        </div>
        <div className={styles.documentListContainer}>
          <DocumentList
            documents={documents}
            selectedDocs={selectedDocs}
            setSelectedDocs={setSelectedDocs}
            onDocumentClick={handleDocumentClick} // Pass the click handler
          />
        </div>
      </div>
      <div className={styles.mainContent}>
        <ChatWindow selectedDocs={selectedDocs} />
      </div>
      {/* <ChatWindow
        selectedDocs={selectedDocs}
        className={styles.mainContent}
      /> */}

      {/* Full-screen Document Modal */}
      {selectedDocument && (
        <DocumentModal
          document={selectedDocument}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default UserPanel;