import React from 'react';
import { Server, CheckCircle2, Wifi, Shield, Cpu, Activity, ArrowUpRight } from 'lucide-react';

export default function ServerHealth({ serverHost = 'camera.sandslab.com' }) {
  const ports = [
    { port: 1935, name: 'RTMP Ingest Port', desc: 'Accepts 4G UNV Camera Video Stream', status: 'Online', protocol: 'TCP' },
    { port: 8889, name: 'WebRTC Player Port', desc: 'Ultra-low latency (<0.2s) browser playback', status: 'Online', protocol: 'TCP' },
    { port: 8888, name: 'HLS Live Stream Port', desc: 'Mobile Safari & iOS HLS playback (.m3u8)', status: 'Online', protocol: 'TCP' },
    { port: 8189, name: 'WebRTC ICE UDP Port', desc: 'P2P NAT Traversal handshake', status: 'Online', protocol: 'UDP' }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Media Server Health & Network Status</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Real-time daemon and streaming port status on your dedicated media cluster.
        </p>
      </div>

      {/* Main Server Overview Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Server size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Streaming Host</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{serverHost}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#f0f9ff',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Daemon Service</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>MediaMTX v1.9.0 (24/7)</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#fdf4ff',
            color: '#c026d3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Average Latency</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#16a34a' }}>&lt; 0.20 seconds (Realtime)</div>
          </div>
        </div>
      </div>

      {/* Ports Status Grid */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
        Configured Ingress & Egress Ports
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {ports.map((p, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '18px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '1rem',
                backgroundColor: '#f1f5f9',
                padding: '4px 8px',
                borderRadius: '6px',
                color: '#0f172a'
              }}>
                Port :{p.port} ({p.protocol})
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: '#dcfce7',
                color: '#15803d',
                padding: '2px 8px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CheckCircle2 size={12} /> {p.status}
              </span>
            </div>
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem', marginBottom: '4px' }}>
              {p.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {p.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
