import React, { useState, useEffect } from 'react';
import { Upload, FileText, RotateCw, Trash2, Plus, X, Star, User, LogOut } from 'lucide-react';
import styles from './AdminPanelPage.module.scss';
import axios from 'axios';

const AdminPanelPage = ({ user, onLogout, onViewUser }) => {
  const [urls, setUrls] = useState(['']);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [currentIndex, setCurrentIndex] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load status initially
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);

      // Axios returns response directly
      const response = await axios.get('http://127.0.0.1:5000/status');

      console.log('Fetched status:', response.data);
      setStatus(response.data);
    } catch (err) {
      setStatus(null);
      setMessage('⚠️ Error fetching status');
      console.error('Fetch status error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddURL = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleAddField = () => {
    setUrls([...urls, '']);
  };

  const handleRemoveField = (index) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    }
  };

  const handleUpload = async () => {
    const cleanUrls = urls.map(url => url.trim()).filter(Boolean);
    if (!cleanUrls.length) return setMessage('❌ Please enter at least one URL');

    setIsLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:5000/upload_urls', {
        file_urls: cleanUrls 
      });

      setMessage('✅ URLs uploaded successfully');
      setUrls(['']);
      await fetchStatus();
    } catch (err) {
      setMessage(`❌ Upload failed: ${err.response?.data?.error || err.message}`);
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSwitchDocument = async () => {
    if (!currentIndex && currentIndex !== 0) return setMessage('❌ Please enter a document index');

    setIsLoading(true);
    try {
      // Simulated API call - replace with actual axios call
      setMessage('✅ Document switched successfully');
      await fetchStatus();
    } catch (err) {
      setMessage(`❌ Failed to switch: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear all documents?')) return;

    setIsLoading(true);
    try {
      // Simulated API call - replace with actual axios call
      setMessage('✅ All documents cleared');
      await fetchStatus();
    } catch (err) {
      setMessage(`❌ Failed to clear: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.title}>
            <div className={styles.titleIcon}>
              <FileText className={styles.titleIconSvg} />
            </div>
            Co-Pilot Admin
          </h1>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li className={`${styles.navItem} ${styles.navItemActive}`}>
              <Upload className={styles.navIcon} />
              Add URLs
            </li>
            <li className={styles.navItem}>
              <FileText className={styles.navIcon} />
              View Documents
            </li>
            <li className={styles.navItem}>
              <RotateCw className={styles.navIcon} />
              Switch Document
            </li>
            <li className={styles.navItem}>
              <Trash2 className={styles.navIcon} />
              Clear All
            </li>
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <p className={styles.userLabel}>Logged in as:</p>
            <p className={styles.userName}>{user?.name || 'Admin User'}</p>
          </div>
          <div className={styles.footerButtons}>
            <button onClick={onViewUser} className={styles.footerButton}>
              <User className={styles.footerButtonIcon} />
              View Co-Pilot
            </button>
            <button onClick={onLogout} className={`${styles.footerButton} ${styles.footerButtonDanger}`}>
              <LogOut className={styles.footerButtonIcon} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.mainTitle}>Document Management</h2>
          <p className={styles.mainSubtitle}>Upload, manage, and switch between documents for the Co-Pilot system</p>
        </div>

        {/* Add URLs Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Upload className={styles.sectionIcon} />
            Add Document URLs
          </h3>

          <div className={styles.urlInputs}>
            {urls.map((url, i) => (
              <div key={i} className={styles.urlInputRow}>
                <input
                  type="text"
                  value={url}
                  onChange={e => handleAddURL(i, e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  className={styles.urlInput}
                />
                <button
                  onClick={() => handleRemoveField(i)}
                  disabled={urls.length === 1}
                  className={styles.removeButton}
                >
                  <X className={styles.removeIcon} />
                </button>
              </div>
            ))}
          </div>

          <div className={styles.actionButtons}>
            <button onClick={handleAddField} className={styles.secondaryButton}>
              <Plus className={styles.buttonIcon} />
              Add URL Field
            </button>
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className={styles.primaryButton}
            >
              <Upload className={styles.buttonIcon} />
              {isLoading ? 'Uploading...' : 'Upload URLs'}
            </button>
          </div>
        </div>

        {/* Current Documents Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <FileText className={styles.sectionIconGreen} />
            Current Documents
          </h3>

          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
            </div>
          ) : status ? (
            <div>
              <div className={styles.statusCard}>
                <p className={styles.statusText}>
                  <strong>Status:</strong> {status.status}
                </p>
              </div>

              {status?.documents?.length > 0 ? (
                <div className={styles.documentList}>
                  {status.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className={`${styles.documentItem} ${doc.is_current ? styles.documentItemCurrent : ''
                        }`}
                    >
                      {doc.is_current && <Star className={styles.starIcon} />}
                      <div className={styles.documentInfo}>
                        <span className={styles.documentType}>{doc.type}</span>
                        <span className={styles.documentName}>{doc.filename}</span>
                      </div>
                      <span className={styles.documentIndex}>#{idx}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <FileText className={styles.emptyIcon} />
                  <p>No documents loaded yet.</p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.loadingText}>
              <div className={styles.pulse}>Loading documents...</div>
            </div>
          )}
        </div>

        {/* Switch Document & Clear All Sections */}
        <div className={styles.gridContainer}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <RotateCw className={styles.sectionIconPurple} />
              Switch Current Document
            </h3>

            <div className={styles.formGroup}>
              <input
                type="number"
                value={currentIndex}
                onChange={e => setCurrentIndex(e.target.value)}
                placeholder="Document index (0-based)"
                className={styles.numberInput}
              />
              <button
                onClick={handleSwitchDocument}
                disabled={isLoading}
                className={styles.purpleButton}
              >
                <RotateCw className={styles.buttonIcon} />
                {isLoading ? 'Switching...' : 'Switch Document'}
              </button>
            </div>
          </div>

          {/* Clear All Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Trash2 className={styles.sectionIconRed} />
              Clear All Documents
            </h3>

            <div className={styles.formGroup}>
              <p className={styles.warningText}>
                This will permanently remove all uploaded documents from the system.
              </p>
              <button
                onClick={handleClear}
                disabled={isLoading}
                className={styles.dangerButton}
              >
                <Trash2 className={styles.buttonIcon} />
                {isLoading ? 'Clearing...' : 'Clear All Documents'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`${styles.statusMessage} ${message.includes('✅') ? styles.statusMessageSuccess : styles.statusMessageError
            }`}>
            {message}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanelPage;