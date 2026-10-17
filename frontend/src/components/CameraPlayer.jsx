import React, { useState, useRef } from 'react';
import { 
  RefreshCw, Maximize2, ExternalLink, Sliders, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, Compass, X
} from 'lucide-react';

export default function CameraPlayer({ camera, isSingleView }) {
  const containerRef = useRef(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPtz, setShowPtz] = useState(false);
  const [ptzAction, setPtzAction] = useState(null);

  const isTypeOnvif = camera.camera_type === 'onvif' || camera.camera_type === 'rtsp';
  const hasPtz = !!camera.ptz_enabled || isTypeOnvif;

  const host = camera.server_host || 'earth.rechargingsolution.in';
  const key = camera.stream_key || 'camera1';
  const webrtcPort = camera.webrtc_port || 8889;

  // Normalize stream path
  const streamPath = key.startsWith('live/') ? key : `live/${key}`;
  const directHttpUrl = `http://${host}:${webrtcPort}/${streamPath}/`;

  const backendBase = typeof window !== 'undefined' && window.location.pathname.includes('/app') ? '../backend/' : '/backend/';
  const onvifParams = isTypeOnvif ? `&type=onvif&onvif_host=${encodeURIComponent(camera.onvif_host || '')}&rtsp_port=${camera.rtsp_port || 554}` : '';
  const iframeSrc = `${backendBase}stream_proxy.php?action=player&host=${encodeURIComponent(host)}&stream=${encodeURIComponent(key)}&webrtc_port=${webrtcPort}${onvifParams}`;

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

  const handlePtzCommand = (command) => {
    setPtzAction(command);
    setTimeout(() => setPtzAction(null), 1200);

    // Call ONVIF PTZ endpoint if available
    try {
      fetch(`${backendBase}onvif.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ptz',
          camera_id: camera.id,
          command: command,
          host: camera.onvif_host || host,
          port: camera.onvif_port || 80
        })
      }).catch(() => {});
    } catch (e) {}
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
        {/* PTZ Toggle for ONVIF */}
        {hasPtz && (
          <button
            onClick={() => setShowPtz(!showPtz)}
            title="Toggle PTZ Controls"
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: showPtz ? '#7e22ce' : 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
              boxShadow: showPtz ? '0 0 10px rgba(126, 34, 206, 0.5)' : 'none'
            }}
          >
            <Compass size={12} />
            <span>PTZ</span>
          </button>
        )}

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

      {/* ONVIF PTZ Keypad Overlay */}
      {showPtz && (
        <div style={{
          position: 'absolute',
          bottom: '14px',
          right: '14px',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '10px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '4px',
            padding: '0 2px'
          }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ONVIF PTZ
            </span>
            <button
              onClick={() => setShowPtz(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '1px' }}
            >
              <X size={12} />
            </button>
          </div>

          {/* Directional Pad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 28px)',
            gridTemplateRows: 'repeat(3, 28px)',
            gap: '3px'
          }}>
            <div />
            <button
              onClick={() => handlePtzCommand('UP')}
              title="Tilt Up"
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronUp size={14} />
            </button>
            <div />

            <button
              onClick={() => handlePtzCommand('LEFT')}
              title="Pan Left"
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => handlePtzCommand('HOME')}
              title="Home Position"
              style={{
                background: '#7e22ce',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ●
            </button>
            <button
              onClick={() => handlePtzCommand('RIGHT')}
              title="Pan Right"
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronRight size={14} />
            </button>

            <div />
            <button
              onClick={() => handlePtzCommand('DOWN')}
              title="Tilt Down"
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronDown size={14} />
            </button>
            <div />
          </div>

          {/* Zoom Buttons */}
          <div style={{ display: 'flex', gap: '4px', width: '100%', marginTop: '3px' }}>
            <button
              onClick={() => handlePtzCommand('ZOOM_IN')}
              title="Zoom In"
              style={{
                flex: 1,
                padding: '4px 0',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#38bdf8',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                fontSize: '0.65rem',
                fontWeight: 600
              }}
            >
              <ZoomIn size={11} /> +
            </button>
            <button
              onClick={() => handlePtzCommand('ZOOM_OUT')}
              title="Zoom Out"
              style={{
                flex: 1,
                padding: '4px 0',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#38bdf8',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                fontSize: '0.65rem',
                fontWeight: 600
              }}
            >
              <ZoomOut size={11} /> -
            </button>
          </div>

          {/* Active Command Feedback Toast */}
          {ptzAction && (
            <div style={{
              fontSize: '0.65rem',
              color: '#4ade80',
              fontWeight: 600,
              textAlign: 'center',
              marginTop: '2px'
            }}>
              Sent: {ptzAction}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
