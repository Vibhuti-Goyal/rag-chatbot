import React from 'react';
import styles from './styles/DocumentList.module.scss';

const DocumentList = ({ documents, selectedDocs, setSelectedDocs, onDocumentClick }) => {
  const toggleSelection = (docId) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📋';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📈';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!documents || documents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📁</div>
        <h3 className={styles.emptyTitle}>No documents found</h3>
        <p className={styles.emptyText}>
          Upload your first document to get started with AI-powered conversations.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.documentList}>
      {documents.map((doc, index) => (
        <div
          key={doc._id}
          className={`${styles.documentItem} ${
            selectedDocs.includes(doc._id) ? styles.selected : ''
          }`}
          style={{
            animationDelay: `${index * 0.1}s`
          }}
        >
          <div className={styles.documentContent}>
            <div className={styles.documentHeader}>
              <div className={styles.fileIcon}>
                {getFileIcon(doc.metadata?.originalFileName || doc.filename)}
              </div>
              <div className={styles.documentInfo}>
                <h3 
                  className={styles.documentTitle}
                  onClick={() => onDocumentClick && onDocumentClick(doc)}
                  title={doc.title}
                >
                  {doc.title}
                </h3>
                <div className={styles.documentMeta}>
                  <span className={styles.fileName}>
                    {doc.metadata?.originalFileName || doc.filename}
                  </span>
                  {doc.metadata?.size && (
                    <span className={styles.fileSize}>
                      {formatFileSize(doc.metadata.size)}
                    </span>
                  )}
                  {doc.uploadedAt && (
                    <span className={styles.uploadDate}>
                      {formatDate(doc.uploadedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {doc.summary && (
              <p className={styles.documentDescription} title={doc.summary}>
                {doc.summary}
              </p>
            )}
          </div>

          <div className={styles.documentActions}>
            <div className={styles.checkboxContainer}>
              <input
                type="checkbox"
                id={`doc-${doc._id}`}
                className={styles.checkbox}
                checked={selectedDocs.includes(doc._id)}
                onChange={() => toggleSelection(doc._id)}
              />
              <label htmlFor={`doc-${doc._id}`} className={styles.checkboxLabel}>
                <svg className={styles.checkIcon} viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;