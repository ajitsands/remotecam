import React from 'react';
import { 
  Grid2X2, 
  Grid3X3, 
  Square, 
  LayoutGrid, 
  Plus, 
  Video, 
  Server, 
  BookOpen, 
  LogOut, 
  User, 
  Activity,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  gridLayout, 
  setGridLayout, 
  user, 
  onLogout, 
  onOpenAddModal,
  cameraCount
}) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
    }}>
      
      {/* Top Header Strip: Branding, Quick Action & User Profile */}
      <div style={{
        borderBottom: '1px solid #f1f5f9',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 24px',
          height: '62px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          
          {/* Left: SaNDS Lab Official Logo & 4G Connect Branding */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} 
            onClick={() => setCurrentTab('live')}
          >
            {/* Official SaNDS Lab Logo Image */}
            <img 
              src="https://qrgenerator.sandslab.com/assets/SaNDSLab-LogoForWhite-C43CoLgA.png" 
              alt="SaNDS Lab Logo" 
              style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            {/* Hexagon Tech Icon Badge */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 3px 8px rgba(2, 132, 199, 0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontFamily: "'Outfit', sans-serif", 
                  fontWeight: 800, 
                  fontSize: '1.25rem', 
                  color: '#0f172a',
                  letterSpacing: '-0.5px' 
                }}>
                  SaNDS <span style={{ color: '#0284c7' }}>Lab</span>
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  letterSpacing: '0.6px'
                }}>
                  4G CONNECT
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                Enterprise Multi-Camera Surveillance & Live Stream Hub
              </div>
            </div>
          </div>

          {/* Right: Add Camera + User Profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            
            {/* Quick Add Camera Button */}
            <button
              onClick={onOpenAddModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={16} />
              <span>Add Camera</span>
            </button>

            {/* User Profile & Logout */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '14px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {user?.full_name || user?.username}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>
                  {user?.role || 'Operator'}
                </span>
              </div>

              <button
                onClick={onLogout}
                title="Logout"
                style={{
                  marginLeft: '6px',
                  padding: '7px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Bottom Menu Strip: Navigation Tabs & Grid Controls */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 24px',
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          
          {/* Navigation Menu Strip */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setCurrentTab('live')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: currentTab === 'live' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                backgroundColor: currentTab === 'live' ? '#0284c7' : 'transparent',
                color: currentTab === 'live' ? '#ffffff' : '#475569',
                boxShadow: currentTab === 'live' ? '0 2px 4px rgba(2, 132, 199, 0.25)' : 'none'
              }}
            >
              <Video size={16} />
              <span>Live Monitor</span>
              {cameraCount > 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: currentTab === 'live' ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0',
                  color: currentTab === 'live' ? '#ffffff' : '#475569',
                  fontWeight: 700
                }}>
                  {cameraCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('cameras')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: currentTab === 'cameras' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                backgroundColor: currentTab === 'cameras' ? '#0284c7' : 'transparent',
                color: currentTab === 'cameras' ? '#ffffff' : '#475569',
                boxShadow: currentTab === 'cameras' ? '0 2px 4px rgba(2, 132, 199, 0.25)' : 'none'
              }}
            >
              <Activity size={16} />
              <span>Manage Cameras</span>
            </button>

            <button
              onClick={() => setCurrentTab('health')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: currentTab === 'health' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                backgroundColor: currentTab === 'health' ? '#0284c7' : 'transparent',
                color: currentTab === 'health' ? '#ffffff' : '#475569',
                boxShadow: currentTab === 'health' ? '0 2px 4px rgba(2, 132, 199, 0.25)' : 'none'
              }}
            >
              <Server size={16} />
              <span>Server Health</span>
            </button>

            {/* Setup Guide Menu Tab */}
            <button
              onClick={() => setCurrentTab('guide')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: currentTab === 'guide' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                backgroundColor: currentTab === 'guide' ? '#0284c7' : 'transparent',
                color: currentTab === 'guide' ? '#ffffff' : '#475569',
                boxShadow: currentTab === 'guide' ? '0 2px 4px rgba(2, 132, 199, 0.25)' : 'none'
              }}
            >
              <BookOpen size={16} />
              <span>Setup Guide</span>
            </button>
          </nav>

          {/* Right Strip Controls: Grid Switcher or Server Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentTab === 'live' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  Grid:
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  padding: '2px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  gap: '2px'
                }}>
                  <button 
                    title="Single View (1x1)" 
                    onClick={() => setGridLayout('1')}
                    style={{
                      padding: '5px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: gridLayout === '1' ? '#0284c7' : 'transparent',
                      color: gridLayout === '1' ? '#ffffff' : '#64748b',
                      display: 'flex'
                    }}
                  >
                    <Square size={15} />
                  </button>
                  
                  <button 
                    title="2x2 Grid View (4 Cameras)" 
                    onClick={() => setGridLayout('4')}
                    style={{
                      padding: '5px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: gridLayout === '4' ? '#0284c7' : 'transparent',
                      color: gridLayout === '4' ? '#ffffff' : '#64748b',
                      display: 'flex'
                    }}
                  >
                    <Grid2X2 size={15} />
                  </button>

                  <button 
                    title="3x3 Grid View (9 Cameras)" 
                    onClick={() => setGridLayout('9')}
                    style={{
                      padding: '5px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: gridLayout === '9' ? '#0284c7' : 'transparent',
                      color: gridLayout === '9' ? '#ffffff' : '#64748b',
                      display: 'flex'
                    }}
                  >
                    <Grid3X3 size={15} />
                  </button>

                  <button 
                    title="4x4 Multi View (16 Cameras)" 
                    onClick={() => setGridLayout('16')}
                    style={{
                      padding: '5px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: gridLayout === '16' ? '#0284c7' : 'transparent',
                      color: gridLayout === '16' ? '#ffffff' : '#64748b',
                      display: 'flex'
                    }}
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </header>
  );
}
