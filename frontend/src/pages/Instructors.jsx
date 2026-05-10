import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiAward, FiClock, FiCheckCircle, FiXCircle, FiPhone, FiMail, FiPlus, FiBriefcase, FiShield, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';
import InstructorModal from '../components/InstructorModal';

const Instructors = () => {
  const { t } = useLanguage();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const res = await api.get('/api/instructors');
      setInstructors(res.data);
    } catch (error) {
      console.error('Failed to fetch instructors', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInstructor = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await api.delete(`/api/instructors/${id}`);
      fetchInstructors();
    } catch (error) {
      alert('Failed to delete instructor');
    }
  };

  const handleEditInstructor = (ins) => {
    setEditingInstructor(ins);
    setShowModal(true);
  };


  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loading')}...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.025em' }}>{t('instructors')}</h1>
          <p style={{ color: 'var(--text-medium)', fontSize: '1rem' }}>Performance et statistiques des moniteurs.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPlus /> {t('add_instructor')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {instructors.map(ins => (
          <div key={ins.instructor_id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ 
                width: '72px', height: '72px', borderRadius: '20px', 
                backgroundColor: 'var(--primary-blue)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: '800'
              }}>
                {ins.name.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>{ins.name}</h3>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FiShield size={10} /> {t(ins.role)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ padding: '0.4rem', color: 'var(--text-medium)' }} onClick={() => handleEditInstructor(ins)} title={t('edit')}><FiEdit size={16} /></button>
                    <button className="btn" style={{ padding: '0.4rem', color: '#EF4444' }} onClick={() => handleDeleteInstructor(ins.instructor_id)} title={t('delete')}><FiTrash2 size={16} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-medium)', fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiPhone /> {ins.phone || 'N/A'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiMail /> {ins.email}</span>
                  </div>
                  {ins.mission && (
                    <div style={{ color: 'var(--primary-blue)', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiBriefcase size={14} /> {ins.mission}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                <FiClock style={{ color: '#6366F1', marginBottom: '0.5rem' }} size={24} />
                <p style={{ fontSize: '0.65rem', color: 'var(--text-medium)', fontWeight: '600', textTransform: 'uppercase' }}>{t('total_hours')}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)' }}>{ins.total_hours}h</p>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                <FiAward style={{ color: '#F59E0B', marginBottom: '0.5rem' }} size={24} />
                <p style={{ fontSize: '0.65rem', color: 'var(--text-medium)', fontWeight: '600', textTransform: 'uppercase' }}>{t('exams')}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)' }}>{ins.total_exams}</p>
              </div>
              <div style={{ backgroundColor: '#DCFCE7', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                <FiCheckCircle style={{ color: '#10B981', marginBottom: '0.5rem' }} size={24} />
                <p style={{ fontSize: '0.65rem', color: '#166534', fontWeight: '600', textTransform: 'uppercase' }}>{t('pass_rate')}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#166534' }}>{ins.pass_rate}%</p>
              </div>
              <div style={{ backgroundColor: '#FEE2E2', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                <FiXCircle style={{ color: '#EF4444', marginBottom: '0.5rem' }} size={24} />
                <p style={{ fontSize: '0.65rem', color: '#991B1B', fontWeight: '600', textTransform: 'uppercase' }}>{t('fail_rate')}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#991B1B' }}>{ins.fail_rate}%</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>{t('monthly_performance')}</span>
                <span style={{ color: '#10B981', fontWeight: 'bold', fontSize: '0.85rem' }}>+12% {t('vs_last_month')}</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', marginTop: '0.75rem', overflow: 'hidden' }}>
                <div style={{ width: `${ins.pass_rate}%`, height: '100%', backgroundColor: ins.pass_rate >= 70 ? '#10B981' : '#F59E0B' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <InstructorModal 
          onClose={() => { setShowModal(false); setEditingInstructor(null); }} 
          onSuccess={fetchInstructors} 
          instructor={editingInstructor}
        />
      )}
    </div>
  );
};

export default Instructors;
