import React, { useState } from 'react';
import { useEffect } from 'react';
import styles from './styles/AdminPanel.module.scss';
import Dashboard from './Dashboard';
import UserAndRole from './UserAndRole';
import DataResource from './DataResource';
import axios from 'axios';
import { SummaryApi } from '../../common';
import DocumentList from '../DocumentList/DocumentList';
import DocumentModal from '../DocumentList/DocumentModel';

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);

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

  const handleDocumentClick = (document) => {
    setSelectedDocument(document);
  };

  // Function to close modal
  const handleCloseModal = () => {
    setSelectedDocument(null);
  };


  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'user-role':
        return <UserAndRole />;
      case 'data-resource':
        return <DataResource />;
      case 'documents':
        return <DocumentList
          documents={documents}
          selectedDocs={selectedDocs}
          setSelectedDocs={setSelectedDocs}
          onDocumentClick={handleDocumentClick}
        />;
      default:
        return <Dashboard />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'user-role', label: 'User & Role', icon: '👥' },
    { id: 'data-resource', label: 'Data Resource', icon: '📁' },
    { id: 'documents', label: 'Documents', icon: '📄' },
  ];

  return (
    <div className={styles.adminPanel}>
      {/* Left Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.title}>Admin Panel</h2>
        </div>
        <nav className={styles.navigation}>
          <ul className={styles.navList}>
            {menuItems.map((item) => (
              <li key={item.id} className={styles.navItem}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`${styles.navButton} ${activeSection === item.id ? styles.active : ''
                    }`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {renderSection()}
        </div>
      </main>

      {selectedDocument && (
        <DocumentModal
          document={selectedDocument}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AdminPanel;