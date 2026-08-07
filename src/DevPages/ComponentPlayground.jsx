import React, { useState } from 'react';
import SuccessPopup from '../components/dialog/SuccessPopup';

/**
 * ComponentPlayground — dev-only route: /dev/components
 * Renders all shared components in isolation for visual testing.
 * Only accessible in development (guarded in App.jsx routes).
 */
export default function ComponentPlayground() {
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div style={{ padding: '32px', fontFamily: 'Poppins, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 8, fontSize: '1.75rem', fontWeight: 700 }}>Component Playground</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        Dev-only. All shared components rendered in isolation.
        URL: <code>/dev/components</code>
      </p>

      {/* ── Dialogs ───────────────────────────────────────────────── */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ borderBottom: '2px solid #4EA24E', paddingBottom: 8, marginBottom: 24 }}>
          Dialogs
        </h2>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            id="playground-success-popup"
            onClick={() => setShowSuccess(true)}
            style={{ padding: '10px 20px', background: '#4EA24E', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Poppins' }}
          >
            Open SuccessPopup
          </button>
        </div>

        <SuccessPopup
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          title="Saved!"
          heading="Changes Saved ✔"
          message="Your details have been successfully saved."
        />
      </section>

      {/* ── Placeholders for upcoming components ──────────────────── */}
      <section>
        <h2 style={{ borderBottom: '2px dashed #ccc', paddingBottom: 8, marginBottom: 16, color: '#999' }}>
          Coming Soon
        </h2>
        <ul style={{ color: '#aaa', lineHeight: 2, paddingLeft: 24 }}>
          <li>DataTable — table/ — 306 duplicate implementations</li>
          <li>FilterPanel — filter/ — 53 duplicate implementations</li>
          <li>ExportButton / PrintButton — button/ — 184 duplicates</li>
          <li>ConfirmDialog — dialog/ — 113 duplicates</li>
          <li>SummaryCard — card/ — 20 duplicates</li>
          <li>PageLayout — layout/ — reduces every page from 800 to 150 lines</li>
        </ul>
      </section>
    </div>
  );
}