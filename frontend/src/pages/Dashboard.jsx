import { useState, useEffect } from 'react';
import api from '../api';
import { FiUsers, FiCalendar, FiDollarSign, FiTruck, FiFacebook, FiInstagram, FiGlobe, FiClock } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';

const StatCard = ({ title, value, icon, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div style={{ 
      width: '64px', height: '64px', borderRadius: '16px', 
      backgroundColor: `${color}15`, color: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{ color: 'var(--text-medium)', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{title}</h3>
      <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.025em' }}>{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    students: 0,
    sessionsCode: 0,
    sessionsDriving: 0,
    sessionsParking: 0,
    revenue: 0,
    vehicles: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/dashboard');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);


  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-medium)' }}>{t('loading')}...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.025em' }}>{t('dashboard')}</h1>
          <p style={{ color: 'var(--text-medium)', fontSize: '1rem', marginTop: '0.25rem' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard title={t('students')} value={stats.students} icon={<FiUsers size={28} />} color="#3B82F6" />
        <StatCard title={t('code')} value={stats.sessionsCode} icon={<FiClock size={28} />} color="#F59E0B" />
        <StatCard title={t('conduite')} value={stats.sessionsDriving} icon={<FiCalendar size={28} />} color="#10B981" />
        <StatCard title={t('parking')} value={stats.sessionsParking} icon={<FiTruck size={28} />} color="#6366F1" />
        <StatCard title={t('revenue')} value={`${stats.revenue} DT`} icon={<FiDollarSign size={28} />} color="#EC4899" />
        <StatCard title={t('fleet')} value={stats.vehicles} icon={<FiTruck size={28} />} color="#8B5CF6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem' }}>{t('recent_activity')}</h2>
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.recentActivity.map((activity, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: activity.type === 'payment' ? '#D1FAE5' : '#DBEAFE', color: activity.type === 'payment' ? '#10B981' : '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activity.type === 'payment' ? <FiDollarSign /> : <FiClock />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                      {activity.type === 'payment' ? t('payments') : t('sessions')} - {activity.student_name}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-medium)' }}>
                      {activity.type === 'payment' ? `${activity.detail} DT` : activity.detail}
                    </p>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-medium)' }}>
                    {new Date(activity.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-medium)', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0', border: '2px dashed #E2E8F0', borderRadius: '12px' }}>
              {t('no_activity')}
            </div>
          )}
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-blue) 0%, #1E40AF 100%)', color: 'white', alignSelf: 'start' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>{t('support')}</h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '1.5rem', lineHeight: '1.6' }}>
            {t('support_desc')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a href="https://www.facebook.com/profile.php?id=61580329281558" target="_blank" rel="noopener noreferrer" className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <FiFacebook /> Facebook
            </a>
            <a href="https://www.instagram.com/itcare_informatique/" target="_blank" rel="noopener noreferrer" className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <FiInstagram /> Instagram
            </a>
            <a href="https://it-care-informatique.vercel.app/fr" target="_blank" rel="noopener noreferrer" className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <FiGlobe /> Site Web
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
