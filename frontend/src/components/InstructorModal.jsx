import { useState } from 'react';
import api from '../api';
import { FiX, FiUser, FiPhone, FiMail, FiLock, FiBriefcase, FiShield } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';

const InstructorModal = ({ onClose, onSuccess, instructor }) => {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState({
    name: instructor?.name || '',
    email: instructor?.email || '',
    password: '',
    phone: instructor?.phone || '',
    mission: instructor?.mission || '',
    role: instructor?.role || 'admin'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (instructor) {
        await api.put(`/api/instructors/${instructor.instructor_id}`, formData);
      } else {
        await api.post('/api/instructors', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${instructor ? 'update' : 'add'} instructor`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div className="card" style={{ 
        width: '100%', maxWidth: '500px', 
        position: 'relative', 
        animation: 'modalSlideUp 0.3s ease-out' 
      }}>
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', top: '1.25rem', 
            right: lang === 'ar' ? 'auto' : '1.25rem', 
            left: lang === 'ar' ? '1.25rem' : 'auto', 
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-medium)' 
          }}
        >
          <FiX size={24} />
        </button>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>{instructor ? t('edit') : t('add_instructor')}</h2>
        <p style={{ color: 'var(--text-medium)', marginBottom: '2rem', fontSize: '0.9rem' }}>Créer un nouveau compte pour un membre de l'équipe.</p>

        {error && (
          <div style={{ 
            backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '0.75rem', 
            borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500'
          }}>
            <FiBriefcase size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
                <FiUser style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> {t('name')}
              </label>
              <input 
                required type="text" className="input-field" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Ex: Ahmed Ben Ali"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
                <FiPhone style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> {t('phone')}
              </label>
              <input 
                required type="text" className="input-field" 
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                placeholder="21 000 000"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
              <FiMail style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> {t('email')}
            </label>
            <input 
              required type="email" className="input-field" 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="email@autoecole.com"
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
              <FiLock style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> {t('password')}
            </label>
            <input 
                required={!instructor} type="password" className="input-field" 
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
                placeholder={instructor ? "•••••••• (laisser vide pour ne pas changer)" : "••••••••"}
              />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
              <FiBriefcase style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> {t('mission')}
            </label>
            <input 
              required type="text" className="input-field" 
              value={formData.mission} onChange={e => setFormData({...formData, mission: e.target.value})} 
              placeholder="Ex: Moniteur Code & Conduite"
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
              <FiShield style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> {t('rank')}
            </label>
            <select 
              className="input-field" 
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value})}
              style={{ backgroundColor: '#F8FAFC' }}
            >
              <option value="admin">{t('admin')}</option>
              {/* Only admin for now as requested */}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button 
              type="button" className="btn" 
              onClick={onClose} 
              style={{ border: '1px solid #E2E8F0', padding: '0.75rem 1.5rem' }}
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" className="btn btn-secondary" 
              disabled={loading}
              style={{ padding: '0.75rem 2rem', minWidth: '140px' }}
            >
              {loading ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstructorModal;
