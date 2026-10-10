import React from 'react';
import { X, MessageCircle, ShoppingBag, Globe, Mail, MapPin, Phone, ExternalLink } from 'lucide-react';

export default function CompanyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px'
    }}>
      <div 
        className="animate-fade-in"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
        >
          <X size={18} />
        </button>

        {/* Modal Top Header with Logo */}
        <div style={{
          padding: '32px 24px 20px',
          textAlign: 'center',
          backgroundColor: 'radial-gradient(circle at 50% 0%, #f0f9ff 0%, #ffffff 80%)',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <img 
            src="https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png" 
            alt="SaNDS Lab Logo" 
            style={{ maxHeight: '54px', maxWidth: '220px', objectFit: 'contain', margin: '0 auto 10px' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '1.35rem',
            fontWeight: 800,
            color: '#0f172a',
            marginTop: '4px'
          }}>
            SaNDS <span style={{ color: '#0284c7' }}>Lab</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>
            Innovating Smart IoT, CCTV & Industrial Electronics
          </p>
        </div>

        {/* Action Buttons Section */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Button 1: WhatsApp Support */}
          <a
            href="https://wa.me/97335078079"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderRadius: '12px',
              backgroundColor: '#25D366',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageCircle size={20} />
              <span>Tech Support WhatsApp</span>
            </div>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>+973 3507 8079</span>
          </a>

          {/* Button 2: Latest Products */}
          <a
            href="https://sandslab.com/products/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderRadius: '12px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag size={20} />
              <span>Our Latest Products</span>
            </div>
            <ExternalLink size={16} />
          </a>

          {/* Button 3: Main Website */}
          <a
            href="https://www.sandslab.com"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              border: '1px solid #cbd5e1',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={20} style={{ color: '#0284c7' }} />
              <span>Our Web Site</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>sandslab.com</span>
          </a>

        </div>

        {/* Company Contact Details Card */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.82rem',
          color: '#475569',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={15} style={{ color: '#0284c7' }} />
            <span>Email: <a href="mailto:support@sandslab.com" style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>support@sandslab.com</a></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={15} style={{ color: '#0284c7' }} />
            <span>Address: <strong>Salmabad, Kingdom of Bahrain</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}
