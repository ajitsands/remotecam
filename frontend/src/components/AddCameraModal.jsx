import React, { useState, useEffect } from 'react';
import { 
  X, Video, Server, MapPin, Key, Copy, Check, Shield, 
  Activity, Sliders, Globe, AlertCircle, RefreshCw, Radio
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

export default function AddCameraModal({ isOpen, onClose, onSave, editingCamera }) {
  const [cameraType, setCameraType] = useState('rtmp'); // 'rtmp' | 'onvif' | 'rtsp'
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  
  // RTMP Fields
  const [streamKey, setStreamKey] = useState('');
  const [serverHost, setServerHost] = useState('earth.rechargingsolution.in');
  const [resolution, setResolution] = useState('1080p');
  const [notes, setNotes] = useState('');

  // ONVIF / RTSP Fields
  const [onvifHost, setOnvifHost] = useState('');
  const [onvifPort, setOnvifPort] = useState(80);
  const [onvifUsername, setOnvifUsername] = useState('admin');
  const [onvifPassword, setOnvifPassword] = useState('');
  const [rtspPort, setRtspPort] = useState(554);
  const [rtspPath, setRtspPath] = useState('live/ch0');
  const [onvifProfile, setOnvifProfile] = useState('Profile1');
  const [ptzEnabled, setPtzEnabled] = useState(false);

  // Probe State
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedRtsp, setCopiedRtsp] = useState(false);

  useEffect(() => {
    if (editingCamera) {
      setCameraType(editingCamera.camera_type || 'rtmp');
      setName(editingCamera.name || '');
      setLocation(editingCamera.location || '');
      setStreamKey(editingCamera.stream_key || '');
      setServerHost(editingCamera.server_host || 'earth.rechargingsolution.in');
      setResolution(editingCamera.resolution || '1080p');
      setNotes(editingCamera.notes || '');

      setOnvifHost(editingCamera.onvif_host || '');
      setOnvifPort(editingCamera.onvif_port || 80);
      setOnvifUsername(editingCamera.onvif_username || 'admin');
      setOnvifPassword('');
      setRtspPort(editingCamera.rtsp_port || 554);
      setRtspPath(editingCamera.rtsp_path || 'live/ch0');
      setOnvifProfile(editingCamera.onvif_profile || 'Profile1');
      setPtzEnabled(!!editingCamera.ptz_enabled);
      setProbeResult(null);
    } else {
      setCameraType('rtmp');
      setName('');
      setLocation('Main Site');
      setStreamKey(`camera${Math.floor(Math.random() * 900) + 100}`);
      setServerHost('earth.rechargingsolution.in');
      setResolution('1080p');
      setNotes('');

      setOnvifHost('192.168.1.100');
      setOnvifPort(80);
      setOnvifUsername('admin');
      setOnvifPassword('');
      setRtspPort(554);
      setRtspPath('live/ch0');
      setOnvifProfile('Profile1');
      setPtzEnabled(false);
      setProbeResult(null);
    }
  }, [editingCamera, isOpen]);

  if (!isOpen) return null;

  const generatedRtmpUrl = `rtmp://${serverHost || 'earth.rechargingsolution.in'}:1935/live/${streamKey || 'camera1'}`;
  const authPrefix = onvifUsername ? `${encodeURIComponent(onvifUsername)}${onvifPassword ? ':••••••' : ''}@` : '';
  const generatedRtspUrl = `rtsp://${authPrefix}${onvifHost || '192.168.1.100'}:${rtspPort || 554}/${rtspPath || 'live/ch0'}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: editingCamera?.id,
      camera_type: cameraType,
      name,
      location,
      stream_key: streamKey,
      server_host: serverHost,
      resolution,
      notes,
      onvif_host: onvifHost,
      onvif_port: onvifPort,
      onvif_username: onvifUsername,
      onvif_password: onvifPassword,
      rtsp_port: rtspPort,
      rtsp_path: rtspPath,
      onvif_profile: onvifProfile,
      ptz_enabled: ptzEnabled
    });
  };

  const handleCopyRtmp = () => {
    copyToClipboard(generatedRtmpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRtsp = () => {
    const rawAuth = onvifUsername ? `${encodeURIComponent(onvifUsername)}${onvifPassword ? ':' + encodeURIComponent(onvifPassword) : ''}@` : '';
    const fullRtsp = `rtsp://${rawAuth}${onvifHost}:${rtspPort}/${rtspPath}`;
    copyToClipboard(fullRtsp);
    setCopiedRtsp(true);
    setTimeout(() => setCopiedRtsp(false), 2000);
  };

  const handleBrandPreset = (brand) => {
    if (brand === 'hikvision') {
      setOnvifPort(80);
      setRtspPort(554);
      setRtspPath('Streaming/Channels/101');
    } else if (brand === 'dahua') {
      setOnvifPort(80);
      setRtspPort(554);
      setRtspPath('cam/realmonitor?channel=1&subtype=0');
    } else if (brand === 'unv') {
      setOnvifPort(80);
      setRtspPort(554);
      setRtspPath('unicast/c1/s0/live');
    } else if (brand === 'axis') {
      setOnvifPort(80);
      setRtspPort(554);
      setRtspPath('axis-media/media.amp');
    } else {
      setOnvifPort(80);
      setRtspPort(554);
      setRtspPath('live/ch0');
    }
  };

  const handleTestOnvifConnection = async () => {
    if (!onvifHost) return;
    setProbing(true);
    setProbeResult(null);

    try {
      const backendBase = typeof window !== 'undefined' && window.location.pathname.includes('/app') ? '../backend/' : '/backend/';
      const res = await fetch(`${backendBase}onvif.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'probe',
          host: onvifHost,
          onvif_port: onvifPort,
          rtsp_port: rtspPort,
          username: onvifUsername,
          password: onvifPassword
        })
      });

      const data = await res.json();
      setProbeResult(data);
      if (data.suggested_path && !editingCamera) {
        setRtspPath(data.suggested_path);
      }
    } catch (err) {
      setProbeResult({
        connected: false,
        message: 'Could not reach local probe service',
        error: err.message
      });
    } finally {
      setProbing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '640px',
        width: '100%',
        maxHeight: '90vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafbfc'
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={20} style={{ color: '#0284c7' }} />
              <span>{editingCamera ? 'Edit Camera Configuration' : 'Add New Camera Source'}</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Configure 4G RTMP Ingest or ONVIF / RTSP Network Video Transmitter
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Protocol Selector Tabs */}
        <div style={{
          display: 'flex',
          padding: '10px 24px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          gap: '8px'
        }}>
          <button
            type="button"
            onClick={() => setCameraType('rtmp')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: cameraType === 'rtmp' ? '1px solid #0284c7' : '1px solid #e2e8f0',
              backgroundColor: cameraType === 'rtmp' ? '#eff6ff' : '#ffffff',
              color: cameraType === 'rtmp' ? '#0369a1' : '#64748b',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <Radio size={14} /> 4G Cloud / RTMP Ingest
          </button>

          <button
            type="button"
            onClick={() => setCameraType('onvif')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: cameraType === 'onvif' ? '1px solid #0284c7' : '1px solid #e2e8f0',
              backgroundColor: cameraType === 'onvif' ? '#eff6ff' : '#ffffff',
              color: cameraType === 'onvif' ? '#0369a1' : '#64748b',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <Shield size={14} /> ONVIF / RTSP IP Camera
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* General Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Camera Name *
              </label>
              <input
                type="text"
                required
                placeholder={cameraType === 'onvif' ? 'e.g. Front Gate ONVIF Dome' : 'e.g. Front Gate 4G'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Location / Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Warehouse Zone A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* ONVIF SPECIFIC CONFIGURATION */}
          {cameraType === 'onvif' ? (
            <div>
              {/* Brand Presets */}
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Quick Brand RTSP Presets:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'generic', label: 'Generic ONVIF' },
                    { id: 'hikvision', label: 'Hikvision' },
                    { id: 'dahua', label: 'Dahua / Amcrest' },
                    { id: 'unv', label: 'Uniview / UNV' },
                    { id: 'axis', label: 'Axis' },
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBrandPreset(b.id)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* IP & Ports */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Camera IP / Host Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.1.108 or host.dyndns.org"
                    value={onvifHost}
                    onChange={(e) => setOnvifHost(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    ONVIF Port
                  </label>
                  <input
                    type="number"
                    value={onvifPort}
                    onChange={(e) => setOnvifPort(parseInt(e.target.value) || 80)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    RTSP Port
                  </label>
                  <input
                    type="number"
                    value={rtspPort}
                    onChange={(e) => setRtspPort(parseInt(e.target.value) || 554)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Credentials */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    ONVIF / RTSP Username
                  </label>
                  <input
                    type="text"
                    placeholder="admin"
                    value={onvifUsername}
                    onChange={(e) => setOnvifUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    ONVIF / RTSP Password {editingCamera ? '(leave blank to keep unchanged)' : ''}
                  </label>
                  <input
                    type="password"
                    placeholder={editingCamera ? '••••••••' : 'Password'}
                    value={onvifPassword}
                    onChange={(e) => setOnvifPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* RTSP Stream Path & PTZ */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    RTSP Stream Path
                  </label>
                  <input
                    type="text"
                    value={rtspPath}
                    onChange={(e) => setRtspPath(e.target.value)}
                    placeholder="live/ch0 or Streaming/Channels/101"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '16px' }}>
                    <input
                      type="checkbox"
                      checked={ptzEnabled}
                      onChange={(e) => setPtzEnabled(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                      Enable PTZ Controls
                    </span>
                  </label>
                </div>
              </div>

              {/* ONVIF Test / Probe Tool */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: probeResult ? '10px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={16} style={{ color: '#0284c7' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                      ONVIF Connection Diagnostics
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestOnvifConnection}
                    disabled={probing || !onvifHost}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: probing || !onvifHost ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {probing ? <RefreshCw size={12} className="spin" /> : <Activity size={12} />}
                    {probing ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>

                {probeResult && (
                  <div style={{
                    fontSize: '0.78rem',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '8px',
                    color: probeResult.connected ? '#166534' : '#991b1b'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: probeResult.connected ? '#22c55e' : '#ef4444'
                      }} />
                      {probeResult.connected ? 'Device Reachable' : 'Unable to connect to camera'}
                      {probeResult.response_time_ms && (
                        <span style={{ color: '#64748b', fontWeight: 400 }}>
                          ({probeResult.response_time_ms} ms)
                        </span>
                      )}
                    </div>
                    {probeResult.device_info && (
                      <div style={{ marginTop: '4px', color: '#475569', fontSize: '0.75rem' }}>
                        Device: <b>{probeResult.device_info.manufacturer}</b> {probeResult.device_info.model} 
                        {probeResult.device_info.firmware_version !== 'N/A' && ` (FW: ${probeResult.device_info.firmware_version})`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Live RTSP Preview Box */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                    Constructed RTSP Video Stream URL:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRtsp}
                    style={{
                      background: '#16a34a',
                      border: 'none',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedRtsp ? <Check size={12} /> : <Copy size={12} />} {copiedRtsp ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <code style={{ fontSize: '0.8rem', color: '#14532d', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {generatedRtspUrl}
                </code>
              </div>
            </div>
          ) : (
            /* RTMP INGEST CONFIGURATION */
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Stream Key / Path *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="camera1, gate_cam, etc."
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Stream Resolution
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: '#fff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="2K / 1440p">2K / 1440p</option>
                    <option value="4K">4K (Ultra HD)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  MediaMTX Server Host
                </label>
                <input
                  type="text"
                  required
                  value={serverHost}
                  onChange={(e) => setServerHost(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Generated RTMP Box */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1' }}>
                    Camera Setup RTMP Address (Paste into UNV / Laptop):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRtmp}
                    style={{
                      background: '#0284c7',
                      border: 'none',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <code style={{ fontSize: '0.82rem', color: '#0c4a6e', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {generatedRtmpUrl}
                </code>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
              }}
            >
              {editingCamera ? 'Save Changes' : (cameraType === 'onvif' ? 'Register ONVIF Camera' : 'Register Camera')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
