import React, { useState, useEffect } from 'react';
import { X, Video, Server, MapPin, Key, Copy, Check } from 'lucide-react';

export default function AddCameraModal({ isOpen, onClose, onSave, editingCamera }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [serverHost, setServerHost] = useState('camera.sandslab.com');
  const [resolution, setResolution] = useState('1080p');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (editingCamera) {
      setName(editingCamera.name || '');
      setLocation(editingCamera.location || '');
      setStreamKey(editingCamera.stream_key || '');
      setServerHost(editingCamera.server_host || 'camera.sandslab.com');
      setResolution(editingCamera.resolution || '1080p');
      setNotes(editingCamera.notes || '');
    } else {
      setName('');
      setLocation('Main Site');
      setStreamKey(`camera${Math.floor(Math.random() * 900) + 100}`);
      setServerHost('camera.sandslab.com');
      setResolution('1080p');
      setNotes('');
    }
  }, [editingCamera, isOpen]);

  if (!isOpen) return null;

  const generatedRtmpUrl = `rtmp://${serverHost || 'earth.rechargingsolution.in'}:1935/live/${streamKey || 'camera1'}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: editingCamera?.id,
      name,
      location,
      stream_key: streamKey,
      server_host: serverHost,
      resolution,
      notes
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedRtmpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={20} style={{ color: '#0284c7' }} />
            <span>{editingCamera ? 'Edit Camera Settings' : 'Add New 4G / IP Camera'}</span>
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Camera Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Front Gate 4G"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Location / Department
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
                  outline: 'none'
                }}
              />
            </div>
          </div>

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
                  fontFamily: 'monospace'
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
                  backgroundColor: '#fff'
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
                fontFamily: 'monospace'
              }}
            />
          </div>

          {/* Generated RTMP Box for UNV Camera */}
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1' }}>
                Camera Setup RTMP Address (Paste into UNV Camera):
              </span>
              <button
                type="button"
                onClick={handleCopy}
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
              {editingCamera ? 'Save Changes' : 'Register Camera'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
