'use client';

import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [isOnline,   setIsOnline]   = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [justCameBack, setJustCameBack] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setJustCameBack(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setJustCameBack(true);
      // Show "back online" for 3 seconds then hide
      setTimeout(() => {
        setShowBanner(false);
        setJustCameBack(false);
      }, 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <>
      <style>{`
        @keyframes slideDown { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slideUp   { from{transform:translateY(0);opacity:1}    to{transform:translateY(-100%);opacity:0} }
        .offline-banner { animation: slideDown 0.3s ease forwards; }
        .offline-banner.hiding { animation: slideUp 0.3s ease forwards; }
      `}</style>
      <div className="offline-banner"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
          padding: '10px 20px',
          background: justCameBack
            ? 'linear-gradient(135deg,rgba(52,211,153,0.95),rgba(16,185,129,0.95))'
            : 'linear-gradient(135deg,rgba(239,68,68,0.95),rgba(220,38,38,0.95))',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
        <span style={{ fontSize: 16 }}>{justCameBack ? '✅' : '📡'}</span>
        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'white' }}>
          {justCameBack
            ? 'Back online! Everything is synced.'
            : 'No internet connection — working offline'}
        </span>
        {!justCameBack && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            · Your timer keeps running, data will sync when you reconnect
          </span>
        )}
      </div>
      {/* Push content down when banner is showing */}
      {!justCameBack && <div style={{ height: 44 }} />}
    </>
  );
}