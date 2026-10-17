import React from 'react';
import { BookOpen, Check, Copy, Shield, Video, Server, ArrowRight, ShieldCheck, Radio } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

export default function SetupGuideView({ user }) {
  const [copied, setCopied] = React.useState(null);

  const isSuperAdmin = user?.role === 'superadmin' || user?.username === 'superadmin';

  const copyText = (key, text) => {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const mediamtxGuideUrl = typeof window !== 'undefined' && window.location.pathname.includes('/app')
    ? './remote_camera_setup_guide.html'
    : '/remote_camera_setup_guide.html';

  const unvGuideUrl = typeof window !== 'undefined' && window.location.pathname.includes('/app')
    ? './unv_4g_camera_onvif_setup_guide.html'
    : '/unv_4g_camera_onvif_setup_guide.html';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
          Camera Configuration Cheatsheet
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Parameters for configuring 4G RTMP Ingest and ONVIF / RTSP Network Video Transmitters.
        </p>
      </div>

      {/* ONVIF IP Camera Setup Card (New in ONVIF V1.0) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e9d5ff',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(126, 34, 206, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: '#7e22ce' }} />
            <span>1. ONVIF & RTSP Camera Configuration Guide</span>
          </h2>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '6px',
            backgroundColor: '#f3e8ff',
            color: '#7e22ce'
          }}>
            ONVIF V1.0
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
          To connect your IP cameras via ONVIF, ensure <b>ONVIF protocol is enabled</b> in the camera's web configuration interface and an <b>ONVIF user account</b> with Media/Admin privileges is created.
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '16px' }}>
          <thead>
            <tr style={{ backgroundColor: '#faf5ff', borderBottom: '1px solid #e9d5ff', textAlign: 'left', color: '#6b21a8' }}>
              <th style={{ padding: '10px 14px' }}>Manufacturer</th>
              <th style={{ padding: '10px 14px' }}>Default ONVIF Port</th>
              <th style={{ padding: '10px 14px' }}>RTSP Port</th>
              <th style={{ padding: '10px 14px' }}>Default RTSP Stream URI Pattern</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Uniview (UNV)</td>
              <td style={{ padding: '10px 14px', color: '#7e22ce', fontWeight: 700 }}>80</td>
              <td style={{ padding: '10px 14px', color: '#475569' }}>554</td>
              <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#0f172a' }}>rtsp://user:pass@ip:554/unicast/c1/s0/live</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Hikvision</td>
              <td style={{ padding: '10px 14px', color: '#7e22ce', fontWeight: 700 }}>80 / 8000</td>
              <td style={{ padding: '10px 14px', color: '#475569' }}>554</td>
              <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#0f172a' }}>rtsp://user:pass@ip:554/Streaming/Channels/101</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Dahua / Amcrest</td>
              <td style={{ padding: '10px 14px', color: '#7e22ce', fontWeight: 700 }}>80 / 8080</td>
              <td style={{ padding: '10px 14px', color: '#475569' }}>554</td>
              <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#0f172a' }}>rtsp://user:pass@ip:554/cam/realmonitor?channel=1&subtype=0</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Generic / Other</td>
              <td style={{ padding: '10px 14px', color: '#7e22ce', fontWeight: 700 }}>80 / 8899 / 5000</td>
              <td style={{ padding: '10px 14px', color: '#475569' }}>554</td>
              <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#0f172a' }}>rtsp://user:pass@ip:554/live/ch0</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Main Parameters Table (Visible to Admin and Super Admin) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
      }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} style={{ color: '#0284c7' }} />
          <span>2. UNV 4G / RTMP Camera Web Interface (192.168.8.x)</span>
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '10px 14px' }}>Camera Menu</th>
              <th style={{ padding: '10px 14px' }}>Field Name</th>
              <th style={{ padding: '10px 14px' }}>Required Value</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Setup &rarr; Video</td>
              <td style={{ padding: '10px 14px' }}>Video Compression</td>
              <td style={{ padding: '10px 14px', color: '#0284c7', fontWeight: 700 }}>H.264</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Setup &rarr; Video</td>
              <td style={{ padding: '10px 14px' }}>Resolution & Bitrate</td>
              <td style={{ padding: '10px 14px', color: '#0284c7', fontWeight: 700 }}>1920x1080 (1080p) &bull; 2048 Kbps CBR</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Setup &rarr; Video</td>
              <td style={{ padding: '10px 14px' }}>I-Frame Interval (GOP)</td>
              <td style={{ padding: '10px 14px', color: '#0284c7', fontWeight: 700 }}>50 (2x Framerate)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Setup &rarr; Video</td>
              <td style={{ padding: '10px 14px' }}>U-Code / Smart Codec</td>
              <td style={{ padding: '10px 14px', color: '#ef4444', fontWeight: 700 }}>Off</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Setup &rarr; Audio</td>
              <td style={{ padding: '10px 14px' }}>Audio Input</td>
              <td style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>Off (or AAC if supported)</td>
            </tr>
            <tr>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>Setup &rarr; Media Stream</td>
              <td style={{ padding: '10px 14px' }}>Destination IP</td>
              <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700, fontFamily: 'monospace' }}>
                rtmp://camera.sandslab.com:1935/live/camera1
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Full HTML Documentation Box - ONLY Rendered for Super Admin */}
      {isSuperAdmin && (
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0369a1', margin: 0 }}>Full HTML Documentation</h3>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                letterSpacing: '0.5px'
              }}>
                SUPER ADMIN ONLY
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#0284c7', margin: 0 }}>
              Open the complete, interactive standalone HTML documentation file.
            </p>
          </div>
          <a
            href={mediamtxGuideUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: '#0284c7',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
            }}
          >
            <span>MediaMTX Guide</span>
            <ArrowRight size={15} />
          </a>
        </div>
      )}

      {/* UNV 4G Camera & ONVIF Dedicated Guide (Available to All Admins) */}
      <div style={{
        backgroundColor: '#faf5ff',
        border: '1px solid #e9d5ff',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '16px',
        boxShadow: '0 2px 6px rgba(126, 34, 206, 0.08)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#7e22ce', margin: 0 }}>
              UNV 4G Camera (IPC2A14LP-ADF40KC-4G-E) Master Guide
            </h3>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: '#7e22ce',
              color: '#ffffff',
              letterSpacing: '0.5px'
            }}>
              NEW HTML GUIDE
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#6b21a8', margin: 0 }}>
            Interactive setup guide with RTSP calculator, ONVIF Device Manager troubleshooting, and 4G remote deployment.
          </p>
        </div>
        <a
          href={unvGuideUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '8px',
            backgroundColor: '#7e22ce',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 2px 6px rgba(126, 34, 206, 0.3)'
          }}
        >
          <span>Open UNV 4G Guide</span>
          <ArrowRight size={15} />
        </a>
      </div>

    </div>
  );
}
