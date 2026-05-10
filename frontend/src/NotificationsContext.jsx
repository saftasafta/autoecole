/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from './api';
import { useLanguage } from './LanguageContext';

export const NotificationsContext = createContext();

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [lastChecked, setLastChecked] = useState(null);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [lastDismissedAlertsJson, setLastDismissedAlertsJson] = useState('');
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));


  const buildNotifications = useCallback((vehicles) => {
    const today = new Date();
    const alerts = [];

    vehicles.forEach(v => {
      const label = `${v.model} (${v.registration_plate})`;

      if (v.insurance_expiry) {
        const expDate = new Date(v.insurance_expiry);
        const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) {
          alerts.push({ id: `ins-${v.id}`, type: 'danger', icon: '🛡️', title: t('alert_ins_expired'), message: `${label} — ${daysLeft === 0 ? t('expired') : `${t('expired_since')} ${Math.abs(daysLeft)} ${t('days')}`}`, vehicleId: v.id, action: 'insurance' });
        } else if (daysLeft <= 2) {
          alerts.push({ id: `ins-${v.id}`, type: 'warning', icon: '🛡️', title: t('insurance_ending_soon'), message: `${label} — ${t('insurance_ends_in')} ${daysLeft} ${t('days')}`, vehicleId: v.id, action: 'insurance' });
        }
      }

      if (v.mileage !== undefined && v.last_oil_change_km !== undefined) {
        const driven = (v.mileage || 0) - (v.last_oil_change_km || 0);
        const interval = v.oil_interval || 10000;
        const remaining = interval - driven;
        if (remaining <= 0) {
          alerts.push({ id: `oil-${v.id}`, type: 'danger', icon: '🔧', title: t('alert_oil_required'), message: `${label} — ${t('oil_exceeded')} ${Math.abs(remaining).toLocaleString()} ${t('oil_remaining')}`, vehicleId: v.id, action: 'oil' });
        } else if (remaining <= 1000) {
          alerts.push({ id: `oil-${v.id}`, type: 'warning', icon: '🔧', title: t('oil_soon'), message: `${label} — ${t('oil_left')} ${remaining.toLocaleString()} ${t('oil_to_change')}`, vehicleId: v.id, action: 'oil' });
        }
      }

      if (v.tech_inspection_expiry) {
        const techDate = new Date(v.tech_inspection_expiry);
        const techDays = Math.ceil((techDate - today) / (1000 * 60 * 60 * 24));
        if (techDays <= 0) {
          alerts.push({ id: `tech-${v.id}`, type: 'danger', icon: '📋', title: t('alert_tech_expired'), message: `${label} — ${techDays === 0 ? t('expired') : `${t('expired_since')} ${Math.abs(techDays)} ${t('days')}`}`, vehicleId: v.id, action: 'tech' });
        } else if (techDays <= 2) {
          alerts.push({ id: `tech-${v.id}`, type: 'warning', icon: '📋', title: t('tech_ending_soon'), message: `${label} — ${t('tech_ends_in')} ${techDays} ${t('days')}`, vehicleId: v.id, action: 'tech' });
        }
      }
    });

    return alerts;
  }, [t]);

  const fetchAndBuild = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get('/api/vehicles');
      const alerts = buildNotifications(res.data);
      setNotifications(alerts);
      setLastChecked(new Date());

      const currentAlertsJson = JSON.stringify(alerts.map(a => a.id).sort());
      
      if (alerts.length > 0) {
        setCriticalAlerts(alerts);
        // Only show modal if alerts have changed since last dismissal
        if (currentAlertsJson !== lastDismissedAlertsJson) {
          setShowCriticalModal(true);
          audioRef.current.play().catch(() => {});
          if (alerts.some(a => a.type === 'danger')) {
            audioRef.current.loop = true;
          }
        }
      } else {
        setShowCriticalModal(false);
        setLastDismissedAlertsJson('');
      }
    } catch {
      // Silently ignore
    }
  }, [buildNotifications, lastDismissedAlertsJson]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (active) await fetchAndBuild();
    };
    init();
    
    const interval = setInterval(() => {
      if (active) fetchAndBuild();
    }, 5 * 60 * 1000);
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchAndBuild]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleDismissCritical = () => {
    setShowCriticalModal(false);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    // Record that these alerts have been seen
    setLastDismissedAlertsJson(JSON.stringify(criticalAlerts.map(a => a.id).sort()));
  };

  const refresh = () => fetchAndBuild();

  return (
    <NotificationsContext.Provider value={{ notifications, dismissNotification, refresh, lastChecked }}>
      {children}
      {showCriticalModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem', color: 'white'
        }}>
          <div style={{
            backgroundColor: '#1E293B', padding: '3rem', borderRadius: '32px',
            maxWidth: '600px', width: '100%', textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.5)',
            border: '2px solid #EF4444',
            animation: 'pulse-danger 2s infinite'
          }}>
            <style>
              {`
                @keyframes pulse-danger {
                  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                  70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
              `}
            </style>
            <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🚨</div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#EF4444', marginBottom: '0.5rem' }}>{t('urgent_alert')}</h1>
            <p style={{ color: 'white', opacity: 0.8, marginBottom: '1.5rem', fontWeight: '600' }}>{t('today_date')} {new Date().toLocaleDateString('ar-TN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
              {criticalAlerts.map(alert => (
                <div key={alert.id} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'right' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>{alert.title}</h3>
                  <p style={{ fontSize: '1rem', opacity: 0.9 }}>{alert.message}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={handleDismissCritical}
              style={{
                backgroundColor: '#EF4444', color: 'white', border: 'none',
                padding: '1.25rem 4rem', borderRadius: '16px', fontSize: '1.5rem',
                fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)'
              }}
            >
              {t('i_read_it')}
            </button>
          </div>
        </div>
      )}
    </NotificationsContext.Provider>
  );
};
