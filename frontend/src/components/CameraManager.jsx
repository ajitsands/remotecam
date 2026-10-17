import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, Check, ExternalLink, Video, Shield, MapPin } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

export default function CameraManager({ cameras, onOpenAddModal, onEditCamera, onDeleteCamera }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Camera Management</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Register, configure RTMP ingest paths, and manage all remote 4G / IP cameras.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
          }}
        >
          <Plus size={18} />
          <span>Add New Camera</span>
        </button>
      </div>

      {/* Cameras Table Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '14px 18px' }}>Camera</th>
                <th style={{ padding: '14px 18px' }}>Location</th>
                <th style={{ padding: '14px 18px' }}>RTMP Ingest Address (Camera Setup)</th>
                <th style={{ padding: '14px 18px' }}>Resolution</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cameras.map((cam, index) => (
                <tr 
                  key={cam.id} 
                  style={{ 
                    borderBottom: index !== cameras.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  {/* Camera Name & ID */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#f0f9ff',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Video size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{cam.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          Key: {cam.stream_key}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td style={{ padding: '14px 18px', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} style={{ color: '#94a3b8' }} />
                      <span>{cam.location || 'Site 1'}</span>
                    </div>
                  </td>

                  {/* RTMP Ingest URL with Copy Button */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#f1f5f9',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      maxWidth: '380px'
                    }}>
                      <code style={{ fontSize: '0.78rem', color: '#0369a1', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cam.rtmp_ingest_url}
                      </code>
                      <button
                        onClick={() => handleCopy(cam.id, cam.rtmp_ingest_url)}
                        title="Copy RTMP Ingest Address"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: copiedId === cam.id ? '#10b981' : '#64748b',
                          display: 'flex',
                          padding: '2px'
                        }}
                      >
                        {copiedId === cam.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>

                  {/* Resolution */}
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#f1f5f9',
                      color: '#334155'
                    }}>
                      {cam.resolution || '1080p'}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span className="live-pulse" style={{ width: '6px', height: '6px' }} />
                      Active
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <a
                        href={cam.webrtc_play_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open Raw Stream"
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          color: '#475569',
                          display: 'flex'
                        }}
                      >
                        <ExternalLink size={15} />
                      </a>

                      <button
                        onClick={() => onEditCamera(cam)}
                        title="Edit Camera"
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          color: '#0284c7',
                          cursor: 'pointer',
                          display: 'flex'
                        }}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        onClick={() => onDeleteCamera(cam.id)}
                        title="Delete Camera"
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid #fee2e2',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex'
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
