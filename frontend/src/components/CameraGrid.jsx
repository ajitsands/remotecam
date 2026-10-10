import React from 'react';
import CameraCard from './CameraCard';
import { VideoOff, Plus } from 'lucide-react';

export default function CameraGrid({ cameras, gridLayout, onOpenAddModal, onEditCamera, onDeleteCamera }) {
  if (!cameras || cameras.length === 0) {
    return (
      <div style={{
        maxWidth: '700px',
        margin: '60px auto',
        padding: '40px 24px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#f0f9ff',
          color: '#0284c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <VideoOff size={32} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          No Cameras Connected Yet
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px' }}>
          Add your 4G UNV camera or IP camera to start streaming live with ultra-low latency WebRTC monitoring.
        </p>
        <button
          onClick={onOpenAddModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
          }}
        >
          <Plus size={18} />
          <span>Add Your First Camera</span>
        </button>
      </div>
    );
  }

  // Calculate CSS Grid columns based on selected layout (1, 4, 9, 16)
  const getGridStyle = () => {
    switch (gridLayout) {
      case '1':
        return {
          gridTemplateColumns: '1fr',
          maxWidth: '1200px',
          margin: '0 auto'
        };
      case '4':
        return {
          gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))'
        };
      case '9':
        return {
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
        };
      case '16':
        return {
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
        };
      default:
        return {
          gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))'
        };
    }
  };

  return (
    <div style={{
      display: 'grid',
      gap: '16px',
      ...getGridStyle()
    }}>
      {cameras.map(camera => (
        <CameraCard
          key={camera.id}
          camera={camera}
          onEdit={onEditCamera}
          onDelete={onDeleteCamera}
          isSingleView={gridLayout === '1'}
        />
      ))}
    </div>
  );
}
