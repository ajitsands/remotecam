import React, { useState } from 'react';
import CameraPlayer from './CameraPlayer';
import { 
  Wifi, 
  Copy,
  Check,
  ExternalLink,
  Info
} from 'lucide-react';

export default function CameraCard({ camera, onEdit, onDelete, isSingleView }) {
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const host = camera.server_host || 'earth.rechargingsolution.in';
  const key = camera.stream_key || 'camera1';
  const webrtcPort = camera.webrtc_port || 8889;
  const streamPath = key.startsWith('live/') ? key : `live/${key}`;

  const webrtcUrl = `http://${host}:${webrtcPort}/${streamPath}/`;
  const rtmpIngest = `rtmp://${host}:1935/${streamPath}`;

  const handleCopyRtmp = () => {
    navigator.clipboard.writeText(rtmpIngest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
        transition: 'all 0.2s',
        position: 'relative',
        height: isSingleView ? 'calc(100vh - 160px)' : '100%',
        minHeight: isSingleView ? '500px' : '300px'
      }}
    >
      {/* Camera Header Bar */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span className="live-pulse" title="Camera Streaming Live" />
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {camera.name}
            </h3>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {camera.location || 'Remote Site'} &bull; <span style={{ color: '#0284c7', fontFamily: 'monospace' }}>{key}</span>
            </div>
          </div>
        </div>

        {/* Header Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <Wifi size={10} /> LIVE
          </span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#f1f5f9',
            color: '#475569'
          }}>
            {camera.resolution || '1080p'}
          </span>
        </div>
      </div>

      {/* Live Video Stage Container */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <CameraPlayer camera={camera} isSingleView={isSingleView} />
      </div>

      {/* Card Footer Actions */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={handleCopyRtmp}
          style={{
            fontSize: '0.75rem',
            color: '#0284c7',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'RTMP URL Copied' : 'Copy Camera RTMP'}</span>
        </button>

        <a 
          href={webrtcUrl} 
          target="_blank" 
          rel="noreferrer"
          style={{
            fontSize: '0.75rem',
            color: '#64748b',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>Open Full View</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
