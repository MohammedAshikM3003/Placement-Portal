import React, { useEffect, useState } from 'react';

export default function ResumePreviewPage() {
  const [resumeUrl, setResumeUrl] = useState('');

  useEffect(() => {
    try {
      const storedUrl = sessionStorage.getItem('resumePreviewUrl') || '';
      setResumeUrl(storedUrl);
    } catch {
      setResumeUrl('');
    }
  }, []);

  if (!resumeUrl) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        color: '#1f2937',
        fontFamily: 'Arial, sans-serif',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Resume preview is unavailable</h1>
          <p style={{ marginTop: '12px', fontSize: '16px' }}>Open the resume from the Resume page or create it again to preview it here.</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      title="Resume Preview"
      src={resumeUrl}
      style={{ width: '100vw', height: '100vh', border: 0, display: 'block', background: '#fff' }}
    />
  );
}