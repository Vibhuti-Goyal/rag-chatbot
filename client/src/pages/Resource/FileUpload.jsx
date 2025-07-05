import React, { useState } from 'react';
import { SummaryApi } from '../../common';
import styles from './styles/FileUpload.module.scss';

const departmentsList = ['sales', 'hr', 'engineering', 'finance', 'legal', 'admin'];
const fileTypes = ['html', 'pdf', 'docx', 'txt', 'other'];

const ResourceUpload = () => {
  const [urls, setUrls] = useState([{ url: '', fileType: 'html' }]);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleUrlChange = (index, value) => {
    const updated = [...urls];
    updated[index].url = value;
    setUrls(updated);
  };

  const handleFileTypeChange = (index, fileType) => {
    const updated = [...urls];
    updated[index].fileType = fileType;
    setUrls(updated);
  };

  const addUrlField = () => setUrls([...urls, { url: '', fileType: 'html' }]);

  const removeUrlField = (index) => {
    const updated = [...urls];
    updated.splice(index, 1);
    setUrls(updated);
  };

  const toggleDepartment = (dept) => {
    setSelectedDepts((prev) =>
      prev.includes(dept)
        ? prev.filter((d) => d !== dept)
        : [...prev, dept]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (urls.some((item) => item.url.trim() === '') || selectedDepts.length === 0) {
      setMessage('Please provide valid URLs and select at least one department.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    const sendBody=JSON.stringify({ 
          file_urls: urls.map(item => item.url), 
          file_types: urls.map(item => item.fileType),
          departments: selectedDepts 
        })
    console.log('Sending data:', sendBody);
    try {
      const res = await fetch(SummaryApi.UploadUrls.url, {
        method: SummaryApi.UploadUrls.method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          file_urls: urls.map(item => item.url), 
          file_types: urls.map(item => item.fileType),
          departments: selectedDepts 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Upload initiated successfully!');
        setUrls([{ url: '', fileType: 'html' }]);
        setSelectedDepts([]);
      } else {
        setMessage(data.message || 'Failed to upload resources.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error during upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDepartmentIcon = (dept) => {
    const icons = {
      sales: '💼',
      hr: '👥',
      engineering: '⚙️',
      finance: '💰',
      legal: '⚖️',
      admin: '🔧'
    };
    return icons[dept] || '📁';
  };

  const getDepartmentColor = (dept) => {
    const colors = {
      sales: '#3b82f6',
      hr: '#10b981',
      engineering: '#f59e0b',
      finance: '#ef4444',
      legal: '#8b5cf6',
      admin: '#6b7280'
    };
    return colors[dept] || '#6b7280';
  };

  const getFileTypeIcon = (fileType) => {
    const icons = {
      html: '🌐',
      pdf: '📄',
      docx: '📝',
      txt: '📋',
      other: '📁'
    };
    return icons[fileType] || '📁';
  };

  const getFileTypeColor = (fileType) => {
    const colors = {
      html: '#ff6b35',
      pdf: '#dc2626',
      docx: '#2563eb',
      txt: '#059669',
      other: '#6b7280'
    };
    return colors[fileType] || '#6b7280';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Upload Resources by URL</h2>
        <p className={styles.subtitle}>
          Add resource URLs, specify file types, and assign them to specific departments for organized access
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* URL Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🔗</span>
              Resource URLs & File Types
            </h3>
            <p className={styles.sectionDescription}>
              Enter the URLs of resources you want to upload and specify their file types
            </p>
          </div>

          <div className={styles.urlList}>
            {urls.map((item, idx) => (
              <div key={idx} className={styles.urlItem} style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className={styles.urlNumber}>{idx + 1}</div>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    placeholder="https://example.com/resource"
                    value={item.url}
                    onChange={(e) => handleUrlChange(idx, e.target.value)}
                    className={styles.urlInput}
                  />
                  <div className={styles.inputIcon}>🌐</div>
                </div>
                <div className={styles.fileTypeWrapper}>
                  <select
                    value={item.fileType}
                    onChange={(e) => handleFileTypeChange(idx, e.target.value)}
                    className={styles.fileTypeSelect}
                    style={{ 
                      '--file-type-color': getFileTypeColor(item.fileType)
                    }}
                  >
                    {fileTypes.map((type) => (
                      <option key={type} value={type}>
                        {getFileTypeIcon(type)} {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                {urls.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeUrlField(idx)}
                    className={styles.removeButton}
                    title="Remove URL"
                  >
                    <span className={styles.removeIcon}>🗑️</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={addUrlField}
            className={styles.addButton}
          >
            <span className={styles.addIcon}>➕</span>
            Add Another URL
          </button>
        </div>

        {/* Department Selection */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🏢</span>
              Department Access
            </h3>
            <p className={styles.sectionDescription}>
              Select which departments can access these resources
            </p>
          </div>

          <div className={styles.departmentGrid}>
            {departmentsList.map((dept) => (
              <label 
                key={dept} 
                className={`${styles.departmentCard} ${selectedDepts.includes(dept) ? styles.selected : ''}`}
                style={{ 
                  '--dept-color': getDepartmentColor(dept),
                  '--dept-color-light': `${getDepartmentColor(dept)}20`
                }}
              >
                <input
                  type="checkbox"
                  value={dept}
                  checked={selectedDepts.includes(dept)}
                  onChange={() => toggleDepartment(dept)}
                  className={styles.departmentCheckbox}
                />
                <div className={styles.departmentContent}>
                  <div className={styles.departmentIcon}>
                    {getDepartmentIcon(dept)}
                  </div>
                  <div className={styles.departmentInfo}>
                    <span className={styles.departmentName}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </span>
                  </div>
                </div>
                <div className={styles.checkmark}>✓</div>
              </label>
            ))}
          </div>

          {selectedDepts.length > 0 && (
            <div className={styles.selectedSummary}>
              <span className={styles.summaryLabel}>Selected departments:</span>
              <div className={styles.selectedTags}>
                {selectedDepts.map((dept) => (
                  <span 
                    key={dept} 
                    className={styles.selectedTag}
                    style={{ backgroundColor: getDepartmentColor(dept) }}
                  >
                    {getDepartmentIcon(dept)} {dept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Section */}
        <div className={styles.submitSection}>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`${styles.submitButton} ${isSubmitting ? styles.submitting : ''}`}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner}></span>
                Uploading...
              </>
            ) : (
              <>
                <span className={styles.submitIcon}>🚀</span>
                Upload Resources
              </>
            )}
          </button>
        </div>
      </form>

      {message && (
        <div className={`${styles.message} ${message.includes('successfully') ? styles.success : styles.error}`}>
          <span className={styles.messageIcon}>
            {message.includes('successfully') ? '✅' : '⚠️'}
          </span>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default ResourceUpload;