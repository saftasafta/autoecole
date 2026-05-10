import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiSave, FiTag, FiClock, FiAward } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';

const Tariffs = () => {
  const { t } = useLanguage();
  const [tariffs, setTariffs] = useState({
    code_hour_price: 15,
    driving_hour_price: 25,
    exam_code_price: 50,
    exam_driving_price: 50,
    exam_parking_price: 50
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTariffs();
  }, []);

  const fetchTariffs = async () => {
    try {
      const res = await api.get('/api/tariffs');
      if (res.data) setTariffs(res.data);
    } catch (error) { console.error('Failed to fetch tariffs', error); } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/api/tariffs', tariffs);
      setMessage(t('settings_saved'));
      setTimeout(() => setMessage(''), 3000);
    } catch (error) { setMessage('Failed to update tariffs.'); } finally { setSaving(false); }
  };


  if (loading) return <div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>{t('loading')}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>{t('tariffs')}</h1>
        <p style={{ color: 'var(--text-medium)', fontSize: '1.125rem' }}>Configurez vos tarifs standards pour les cours et les examens.</p>
      </div>

      <div className="card" style={{ padding: '2.5rem' }}>
        {message && (
          <div style={{ padding: '1rem 1.5rem', marginBottom: '2rem', borderRadius: '12px', backgroundColor: '#F0FDF4', color: '#166534', fontWeight: '600', border: '1px solid #BBF7D0', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '2.5rem' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-blue)' }}>
               <FiClock /> {t('lessons')}
             </h2>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.75rem' }}>{t('tarif_heure_code')} (DT)</label>
                  <input type="number" step="0.5" required className="input-field" value={tariffs.code_hour_price} onChange={e => setTariffs({...tariffs, code_hour_price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.75rem' }}>{t('tarif_heure_conduite')} (DT)</label>
                  <input type="number" step="0.5" required className="input-field" value={tariffs.driving_hour_price} onChange={e => setTariffs({...tariffs, driving_hour_price: e.target.value})} />
                </div>
             </div>
          </div>

          <div style={{ marginBottom: '3rem' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-blue)' }}>
               <FiAward /> {t('exams')}
             </h2>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.75rem' }}>{t('examen_code')} (DT)</label>
                  <input type="number" step="0.5" required className="input-field" value={tariffs.exam_code_price} onChange={e => setTariffs({...tariffs, exam_code_price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.75rem' }}>{t('examen_conduite')} (DT)</label>
                  <input type="number" step="0.5" required className="input-field" value={tariffs.exam_driving_price} onChange={e => setTariffs({...tariffs, exam_driving_price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.75rem' }}>{t('examen_parking')} (DT)</label>
                  <input type="number" step="0.5" required className="input-field" value={tariffs.exam_parking_price} onChange={e => setTariffs({...tariffs, exam_parking_price: e.target.value})} />
                </div>
             </div>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ width: '100%', height: '50px', fontSize: '1rem', fontWeight: '700' }} disabled={saving}>
            <FiSave /> {saving ? t('loading') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Tariffs;
