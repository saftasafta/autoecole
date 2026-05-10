import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiCalendar, FiCreditCard, FiLogOut, FiTag, FiClipboard, FiTruck, FiAward, FiDollarSign, FiBell, FiX } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';
import { useNotifications } from '../NotificationsContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const { notifications, dismissNotification } = useNotifications();
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: t('dashboard'), path: '/dashboard', icon: <FiHome size={20} /> },
    { name: t('students'), path: '/students', icon: <FiUsers size={20} /> },
    { name: t('exams'), path: '/exams', icon: <FiClipboard size={20} /> },
    { name: t('sessions'), path: '/sessions', icon: <FiCalendar size={20} /> },
    { name: t('payments'), path: '/payments', icon: <FiCreditCard size={20} /> },
    { name: t('fleet'), path: '/fleet', icon: <FiTruck size={20} /> },
    { name: t('finances'), path: '/finances', icon: <FiDollarSign size={20} /> },
    { name: t('instructors'), path: '/instructors', icon: <FiAward size={20} /> },
    { name: t('tariffs'), path: '/tariffs', icon: <FiTag size={20} /> },
  ];

  const dangerCount = notifications.filter(n => n.type === 'danger').length;
  const totalCount = notifications.length;

  return (
    <>
      <div style={{
        width: '260px',
        backgroundColor: 'var(--primary-blue)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: lang === 'ar' ? '-4px 0 10px rgba(0,0,0,0.1)' : '4px 0 10px rgba(0,0,0,0.1)',
        zIndex: 10,
        transition: 'var(--transition)'
      }}>
        {/* Logo */}
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--accent-yellow)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--primary-blue)', fontWeight: 'bold', fontSize: '1.2rem' }}>A</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.5px', flex: 1 }}>Auto-École</h2>

          {/* Notification Bell */}
          <button
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            style={{
              position: 'relative',
              background: totalCount > 0 ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            title="الإشعارات"
          >
            <FiBell size={20} />
            {totalCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: dangerCount > 0 ? '#EF4444' : '#F59E0B',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: '800',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--primary-blue)'
              }}>
                {totalCount}
              </span>
            )}
          </button>
        </div>

        <nav style={{ flex: 1, padding: '0 1rem', marginTop: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    color: isActive ? 'var(--primary-blue)' : '#D1D5DB',
                    backgroundColor: isActive ? 'var(--accent-yellow)' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? '700' : '500',
                    transition: 'var(--transition)'
                  })}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Language Switcher */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '10px' }}>
            {['ar', 'fr', 'en'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: lang === l ? 'var(--accent-yellow)' : 'transparent',
                  color: lang === l ? 'var(--primary-blue)' : 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  transition: 'var(--transition)'
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              width: '100%',
              padding: '0.8rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              borderRadius: '12px',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FiLogOut size={20} />
            {t('logout')}
          </button>
        </div>
      </div>

      {/* Notifications Panel (Overlay) */}
      {showNotifPanel && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowNotifPanel(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 998, background: 'transparent'
            }}
          />

          {/* Panel */}
          <div style={{
            position: 'fixed',
            top: '1rem',
            left: lang === 'ar' ? 'auto' : '270px',
            right: lang === 'ar' ? '270px' : 'auto',
            width: '360px',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            zIndex: 999,
            overflow: 'hidden',
            animation: 'slideDown 0.2s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #1E3A5F, #2563EB)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiBell size={20} />
                <span style={{ fontWeight: '800', fontSize: '1rem' }}>الإشعارات</span>
                {totalCount > 0 && (
                  <span style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '20px'
                  }}>{totalCount}</span>
                )}
              </div>
              <button
                onClick={() => setShowNotifPanel(false)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  <FiBell size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>لا توجد إشعارات</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>كل شيء على ما يرام ✅</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #F1F5F9',
                    backgroundColor: n.type === 'danger' ? '#FFF5F5' : '#FFFBEB',
                    transition: 'background 0.2s'
                  }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                      backgroundColor: n.type === 'danger' ? '#FEE2E2' : '#FEF3C7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      {n.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: '700', fontSize: '0.85rem',
                        color: n.type === 'danger' ? '#991B1B' : '#92400E',
                        marginBottom: '0.2rem'
                      }}>
                        {n.title}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissNotification(n.id)}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#CBD5E1', padding: '0.25rem', borderRadius: '6px',
                        display: 'flex', alignItems: 'center', flexShrink: 0
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
                <a href="/fleet" onClick={() => setShowNotifPanel(false)} style={{
                  color: '#2563EB', fontWeight: '700', fontSize: '0.85rem',
                  textDecoration: 'none'
                }}>
                  🚗 عرض مراقبة السيارات
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
