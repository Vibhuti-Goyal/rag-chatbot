import React, { useEffect } from 'react';
import styles from './styles/DocumentModal.module.scss';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DocumentModal = ({ document: doc, onClose }) => {
    if (!doc) return null;

    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscapeKey);
        return () => window.removeEventListener('keydown', handleEscapeKey);
    }, [onClose]);

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) onClose();
    };

    const getFileIcon = (filename) => {
        const extension = filename?.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf': return '📄';
            case 'doc':
            case 'docx': return '📝';
            case 'txt': return '📋';
            case 'xls':
            case 'xlsx': return '📊';
            case 'ppt':
            case 'pptx': return '📈';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif': return '🖼️';
            default: return '📄';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    function cleanMarkdownTables(md) {
        return md
            .split('\n')
            .map(line => {
                if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                    // Count how many columns in first line
                    const cols = line.split('|').filter(Boolean).length;
                    return line
                        .split('|')
                        .filter((seg, i) => i !== 0 && i !== cols)  // Remove leading/trailing empty
                        .map(seg => seg.trim())
                        .join(' | ');
                }
                return line;
            })
            .join('\n');
    }

    return (
        <div className={styles.modalOverlay} onClick={handleBackdropClick}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <div className={styles.fileIcon}>{getFileIcon(doc.title)}</div>
                        <div className={styles.titleSection}>
                            <h2 className={styles.modalTitle}>{doc.title}</h2>
                            <p className={styles.fileName}>{doc.fileType?.toUpperCase()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className={styles.closeButton} aria-label="Close modal">
                        <svg viewBox="0 0 24 24" className={styles.closeIcon}>
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.documentInfo}>
                        <div className={styles.infoGrid}>
                            {doc.uploadedAt && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Upload Date</span>
                                    <span className={styles.infoValue}>{formatDate(doc.uploadedAt)}</span>
                                </div>
                            )}
                            {doc.fileType && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Document Type</span>
                                    <span className={styles.infoValue}>{doc.fileType}</span>
                                </div>
                            )}
                            {doc.status && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Status</span>
                                    <span className={styles.infoValue}>{doc.status}</span>
                                </div>
                            )}
                            {doc.departments?.length > 0 && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Departments</span>
                                    <span className={styles.infoValue}>{doc.departments.join(', ')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.summarySection}>
                        <h3 className={styles.sectionTitle}>📝 Document Summary</h3>
                        <div className={styles.summaryContent}>
                            <p className={styles.summaryText}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {cleanMarkdownTables(doc.summary || 'No summary available for this document.')}
                                </ReactMarkdown>
                            </p>
                        </div>
                    </div>

                    {doc.sourcePath && (
                        <div className={styles.linkSection}>
                            <h3 className={styles.sectionTitle}>🔗 Document Link</h3>
                            <div className={styles.linkContainer}>
                                <a
                                    href={doc.sourcePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.documentLink}
                                >
                                    🌐 Open Original Document ↗
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className={styles.footerButton}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default DocumentModal;
