import React, { useState, useRef } from 'react';
import { RefreshCw, Maximize2, ExternalLink } from 'lucide-react';

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

  // Determine iframe source:
  // If running on HTTPS (or non-localhost), use the HTTPS stream proxy to prevent Mixed Content blocking.
  const isHttpsParent = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const backendBase = typeof window !== 'undefined' && window.location.pathname.includes('/app') ? '../backend/' : '/backend/';
  const proxiedPlayerUrl = `${backendBase}stream_proxy.php?action=player&host=${encodeURIComponent(host)}&stream=${encodeURIComponent(key)}&webrtc_port=${webrtcPort}`;
  
  const iframeSrc = isHttpsParent 
    ? proxiedPlayerUrl 
    : `${directHttpUrl}?autoplay=1&muted=1&controls=1`;

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
      {/* Live WebRTC Stream Iframe */}
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

      {/* Loading Overlay */}
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
