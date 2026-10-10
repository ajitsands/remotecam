import React, { useState } from 'react';
import { Lock, User, Mail, ShieldCheck, ArrowRight, Video, Sparkles } from 'lucide-react';
import CompanyModal from './CompanyModal';

export default function LoginView({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const action = isRegistering ? 'register' : 'login';
    const payload = isRegistering 
      ? { username, email, password, full_name: fullName }
      : { username, password };

    try {
      // Primary relative path from /app/index.html to backend/auth.php
      const apiUrl = window.location.pathname.includes('/app') 
        ? '../backend/auth.php?action=' + action
        : '/backend/auth.php?action=' + action;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === 'success') {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      // Fallback for standalone demo access if backend is unreachable
      if (username === 'superadmin' && password === 'S@nds1@b') {
        onLoginSuccess({ id: 1, username: 'superadmin', full_name: 'SaNDS Super Admin', role: 'superadmin' });
        return;
      }
      if (username === 'admin' && password === 'admin123') {
        onLoginSuccess({ id: 2, username: 'admin', full_name: 'SaNDS Administrator', role: 'admin' });
        return;
      }
      setError('Connection error or invalid credentials. Check database setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminLogin = () => {
    setUsername('superadmin');
    setPassword('S@nds1@b');
    onLoginSuccess({
      id: 1,
      username: 'superadmin',
      full_name: 'SaNDS Super Admin',
      role: 'superadmin'
    });
  };

  const handleAdminLogin = () => {
    setUsername('admin');
    setPassword('admin123');
    onLoginSuccess({
      id: 2,
      username: 'admin',
      full_name: 'SaNDS Administrator',
      role: 'admin'
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '36px 32px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)'
      }}>
        
        {/* Logo & Branding */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          
          {/* Official SaNDS Lab Logo Image on Top */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <img 
              src="https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png" 
              alt="SaNDS Lab Logo" 
              style={{ maxHeight: '50px', maxWidth: '220px', objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          {/* Title: SaNDS Lab 4G Connect */}
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '1.7rem',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.5px',
            marginBottom: '10px'
          }}>
            SaNDS <span style={{ color: '#0284c7' }}>Lab</span> 4G Connect
          </h1>

          {/* Icon Badge Below The SaNDS Lab 4G Connect Title */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.28)'
            }}>
              <ShieldCheck size={24} />
            </div>
          </div>

          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
            {isRegistering ? 'Create a secure operator account' : 'Sign in to access your multi-camera dashboard'}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '18px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {isRegistering && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                <input
                  type="email"
                  required
                  placeholder="admin@sandslab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              opacity: loading ? 0.7 : 1
            }}
          >
            <span>Sign In</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer in Login Card */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: '#64748b'
        }}>
          <span>&copy; {new Date().getFullYear()} &bull; All Rights Reserved and Engineered by </span>
          <button
            type="button"
            onClick={() => setIsCompanyModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            SaNDS Lab
          </button>
        </div>

      </div>

      {/* Company Info Popup */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />
    </div>
  );
}
