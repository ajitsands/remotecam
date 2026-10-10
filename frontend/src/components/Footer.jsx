import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

export default function Footer({ onOpenCompanyModal }) {
  return (
    <footer style={{
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      padding: '20px 24px',
      marginTop: 'auto',
      textAlign: 'center',
      fontSize: '0.88rem',
      color: '#64748b',
      boxShadow: '0 -1px 3px 0 rgba(0, 0, 0, 0.02)'
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <span>&copy; {new Date().getFullYear()} &bull; All Rights Reserved and Engineered by</span>
        <button
          onClick={onOpenCompanyModal}
          title="Click to view SaNDS Lab contact & tech support details"
          style={{
            background: 'none',
            border: 'none',
            color: '#0284c7',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.92rem',
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'underline',
            textUnderlineOffset: '3px'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0f2fe'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Sparkles size={14} style={{ color: '#0ea5e9' }} />
          <span>SaNDS Lab</span>
        </button>
      </div>
    </footer>
  );
}
