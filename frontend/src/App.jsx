import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CameraGrid from './components/CameraGrid';
import CameraManager from './components/CameraManager';
import AddCameraModal from './components/AddCameraModal';
import LoginView from './components/LoginView';
import ServerHealth from './components/ServerHealth';
import SetupGuideView from './components/SetupGuideView';
import Footer from './components/Footer';
import CompanyModal from './components/CompanyModal';

// Default initial cameras
const INITIAL_CAMERAS = [
  {
    id: 1,
    name: '4G UNV Camera 1',
    location: 'Remote Site Alpha',
    stream_key: 'camera1',
    server_host: 'camera.sandslab.com',
    rtmp_port: 1935,
    webrtc_port: 8889,
    hls_port: 8888,
    resolution: '1080p',
    status: 'active',
    rtmp_ingest_url: 'rtmp://camera.sandslab.com:1935/live/camera1',
    webrtc_play_url: 'http://camera.sandslab.com:8889/live/camera1',
    hls_play_url: 'http://camera.sandslab.com:8888/live/camera1/index.m3u8'
  },
  {
    id: 2,
    name: '4G Warehouse Cam 2',
    location: 'Storage Facility Beta',
    stream_key: 'camera2',
    server_host: 'camera.sandslab.com',
    rtmp_port: 1935,
    webrtc_port: 8889,
    hls_port: 8888,
    resolution: '1080p',
    status: 'active',
    rtmp_ingest_url: 'rtmp://camera.sandslab.com:1935/live/camera2',
    webrtc_play_url: 'http://camera.sandslab.com:8889/live/camera2',
    hls_play_url: 'http://camera.sandslab.com:8888/live/camera2/index.m3u8'
  }
];

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sandscam_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentTab, setCurrentTab] = useState('live'); // 'live', 'cameras', 'health', 'guide'
  const [gridLayout, setGridLayout] = useState('4'); // '1', '4', '9', '16'
  const [cameras, setCameras] = useState(() => {
    const saved = localStorage.getItem('sandscam_cameras');
    return saved ? JSON.parse(saved) : INITIAL_CAMERAS;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // Sync cameras to localStorage
  useEffect(() => {
    localStorage.setItem('sandscam_cameras', JSON.stringify(cameras));
  }, [cameras]);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('sandscam_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sandscam_user');
    }
  }, [user]);

  const getApiUrl = (path) => {
    return window.location.pathname.includes('/app') ? `../backend/${path}` : `/backend/${path}`;
  };

  // Fetch from PHP backend if available
  useEffect(() => {
    if (user) {
      fetch(getApiUrl('cameras.php'), { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.cameras && data.cameras.length > 0) {
            setCameras(data.cameras);
          }
        })
        .catch(() => {
          // Keep local state if running standalone vite dev server
        });
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    fetch(getApiUrl('auth.php?action=logout'), { credentials: 'include' }).catch(() => {});
    setUser(null);
  };

  const handleSaveCamera = async (cameraData) => {
    const host = cameraData.server_host || 'camera.sandslab.com';
    const key = cameraData.stream_key || 'camera1';

    const enriched = {
      ...cameraData,
      server_host: host,
      stream_key: key,
      rtmp_ingest_url: `rtmp://${host}:1935/live/${key}`,
      webrtc_play_url: `http://${host}:8889/live/${key}`,
      hls_play_url: `http://${host}:8888/live/${key}/index.m3u8`
    };

    if (cameraData.id && typeof cameraData.id === 'number' && cameraData.id < 1000000000) {
      // Edit existing
      setCameras(prev => prev.map(c => c.id === cameraData.id ? { ...c, ...enriched } : c));
      try {
        await fetch(getApiUrl(`cameras.php?id=${cameraData.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(cameraData)
        });
      } catch (e) {}
    } else {
      // Add new to server
      try {
        const res = await fetch(getApiUrl('cameras.php'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(enriched)
        });
        const data = await res.json();
        if (data.status === 'success' && data.camera) {
          setCameras(prev => [...prev, data.camera]);
        } else {
          setCameras(prev => [...prev, { ...enriched, id: Date.now() }]);
        }
      } catch (e) {
        setCameras(prev => [...prev, { ...enriched, id: Date.now() }]);
      }
    }

    setIsAddModalOpen(false);
    setEditingCamera(null);
  };

  const handleOpenEdit = (camera) => {
    setEditingCamera(camera);
    setIsAddModalOpen(true);
  };

  const handleDeleteCamera = async (id) => {
    if (window.confirm('Are you sure you want to remove this camera?')) {
      // Update state and localStorage immediately
      setCameras(prev => {
        const updated = prev.filter(c => c.id !== id);
        localStorage.setItem('sandscam_cameras', JSON.stringify(updated));
        return updated;
      });

      // Delete from MySQL database
      try {
        await fetch(getApiUrl(`cameras.php?id=${id}`), {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (e) {}
    }
  };

  // If not logged in, show Login View
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      
      {/* Horizontal Navbar with SanDS Lab Logo */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        gridLayout={gridLayout}
        setGridLayout={setGridLayout}
        user={user}
        onLogout={handleLogout}
        onOpenAddModal={() => {
          setEditingCamera(null);
          setIsAddModalOpen(true);
        }}
        cameraCount={cameras.length}
      />

      {/* Main Content View Container */}
      <main style={{
        flex: 1,
        maxWidth: currentTab === 'live' ? '1600px' : '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px'
      }}>
        {currentTab === 'live' && (
          <CameraGrid
            cameras={cameras}
            gridLayout={gridLayout}
            onOpenAddModal={() => {
              setEditingCamera(null);
              setIsAddModalOpen(true);
            }}
            onEditCamera={handleOpenEdit}
            onDeleteCamera={handleDeleteCamera}
          />
        )}

        {currentTab === 'cameras' && (
          <CameraManager
            cameras={cameras}
            onOpenAddModal={() => {
              setEditingCamera(null);
              setIsAddModalOpen(true);
            }}
            onEditCamera={handleOpenEdit}
            onDeleteCamera={handleDeleteCamera}
          />
        )}

        {currentTab === 'health' && (
          <ServerHealth serverHost="earth.rechargingsolution.in" />
        )}

        {currentTab === 'guide' && (
          <SetupGuideView user={user} />
        )}
      </main>

      {/* Add / Edit Camera Modal */}
      <AddCameraModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCamera(null);
        }}
        onSave={handleSaveCamera}
        editingCamera={editingCamera}
      />

      {/* Footer with SaNDS Lab Link */}
      <Footer onOpenCompanyModal={() => setIsCompanyModalOpen(true)} />

      {/* Company Info Popup */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />

    </div>
  );
}
