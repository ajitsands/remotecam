import React, { useState, useRef } from 'react';
import { RefreshCw, Maximize2, ExternalLink, Play, ShieldAlert } from 'lucide-react';

export default function CameraPlayer({ camera, isSingleView }) {
  const containerRef = useRef(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const host = camera.server_host || 'earth.rechargingsolution.in';
  const key = camera.stream_key || 'camera1';
  const webrtcPort = camera.webrtc_port || 8889;

  // Normalize stream path
  const streamPath = key.startsWith('live/') ? key : `live/${key}`;
  const directHttpUrl = `http://${host}:${webrtcPort}/${streamPath}/`;
  const iframeSrc = `${directHttpUrl}?autoplay=1&muted=1&controls=1`;

  // Detect if parent page is running on HTTPS and stream is HTTP (browser Mixed Content policy)
  const isHttpsParent = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isHttpStream = directHttpUrl.startsWith('http://');
  const isMixedContent = isHttpsParent && isHttpStream;

  const openPopout = () => {
    window.open(
      directHttpUrl,
      `cam_${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
      'width=960,height=580,resizable=yes,scrollbars=no,status=no'
    );
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const reloadStream = () => {
    setLoading(true);
    setIframeKey(prev => prev + 1);
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: isSingleView ? '480px' : '260px',
        backgroundColor: '#090d16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* If Mixed Content is detected (HTTPS parent accessing HTTP camera), show clear launcher */}
      {isMixedContent ? (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: '#94a3b8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '360px'
        }}>
          <ShieldAlert size={32} style={{ color: '#f59e0b' }} />
          <div>
            <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.92rem' }}>
              Direct Live Stream Ready
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#94a3b8', lineHeight: 1.4 }}>
              Web browser security blocks HTTP camera embeds inside HTTPS pages. Click below to view live feed in a dedicated player window.
            </div>
          </div>
          <button
            onClick={openPopout}
            style={{
              marginTop: '4px',
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              transition: 'background-color 0.2s'
            }}
          >
            <Play size={14} /> Open Live Popout Player
          </button>
        </div>
      ) : (
        <>
          {/* Live WebRTC / MediaMTX Stream Iframe */}
          <iframe
            key={iframeKey}
            src={iframeSrc}
            onLoad={() => setLoading(false)}
            allow="autoplay; fullscreen; camera; microphone; encrypted-media"
            title={`Live Stream ${key}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#090d16',
              display: 'block'
            }}
          />

          {/* Loading Spinner */}
          {loading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#090d16',
              color: '#94a3b8',
              gap: '8px',
              fontSize: '0.85rem',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              <div className="live-pulse" style={{ width: '12px', height: '12px' }} />
              <span>Connecting Live Stream...</span>
            </div>
          )}
        </>
      )}

      {/* Floating Action Overlay Bar */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        zIndex: 20
      }}>
        {/* Popout Button */}
        <button
          onClick={openPopout}
          title="Open in Dedicated Popout Window"
          style={{
            padding: '5px 9px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'rgba(2, 132, 199, 0.9)',
            color: '#ffffff',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 600
          }}
        >
          <ExternalLink size={12} />
          <span>Popout Live</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={reloadStream}
          title="Reload Stream"
          style={{
            padding: '6px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            color: '#ffffff',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            display: 'flex'
          }}
        >
          <RefreshCw size={12} />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title="Fullscreen"
          style={{
            padding: '6px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            color: '#ffffff',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            display: 'flex'
          }}
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
}
