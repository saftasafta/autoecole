import { useState, useEffect, useCallback } from 'react';
import api from '../api';

import { FiPlus, FiSearch, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';
import StudentModal from '../components/StudentModal';
import Pagination from '../components/Pagination';

const Students = () => {
  const { t, lang } = useLanguage();
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', cin: '', phone: '', notes: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewStudentId, setViewStudentId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get(`/api/students?page=${page}&limit=20&search=${searchTerm}`);
      setStudents(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalStudents(res.data.total);
    } catch (error) { console.error('Failed to fetch students', error); }
  }, [page, searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchStudents, viewStudentId]);




   const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.put(`/api/students/${editingStudent.id}`, newStudent);
      } else {
        await api.post('/api/students', newStudent);
      }
      setShowModal(false);
      setEditingStudent(null);
      fetchStudents();
      setNewStudent({ name: '', cin: '', phone: '', notes: '' });
    } catch (error) { alert(`Erreur: ${error.response?.data?.error || error.message}`); }
  };


  const handleDeleteStudent = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await api.delete(`/api/students/${id}`);
      fetchStudents();
    } catch (error) { alert(`Erreur: ${error.response?.data?.error || error.message}`); }
  };
  



  const openEditModal = (student) => {
    setEditingStudent(student);
    setNewStudent({ name: student.name, cin: student.cin || '', phone: student.phone || '', notes: student.notes || '' });
    setShowModal(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to page 1 on new search
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.025em' }}>{t('students')}</h1>
          <p style={{ color: 'var(--text-medium)', fontSize: '1rem' }}>{t('students_desc')}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowModal(true)}>
            <FiPlus /> {t('add_student')}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '350px' }}>
            <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-medium)' }} />
            <input type="text" placeholder={t('search')} className="input-field" style={{ paddingLeft: '2.8rem' }} value={searchTerm} onChange={handleSearchChange} />
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-medium)', fontWeight: '500' }}>
            {totalStudents} {t('students')} {t('all')}
          </div>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('cin')}</th>
                <th>{t('phone')}</th>
                <th>{t('sessions')}</th>
                <th>{t('remaining')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-medium)' }}>{t('no_activity')}</td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{student.name.charAt(0)}</div>
                        <span style={{ fontWeight: '700' }}>{student.name}</span>
                      </div>
                    </td>
                    <td>{student.cin || 'N/A'}</td>
                    <td>{student.phone || 'N/A'}</td>
                    <td style={{ fontWeight: '500' }}>{student.total_sessions_count || 0} {lang === 'ar' ? 'حصة' : 'sessions'}</td>
                    <td style={{ fontWeight: '800', color: student.remaining_balance > 0 ? '#EF4444' : '#10B981' }}>{student.remaining_balance > 0 ? student.remaining_balance : 0} DT</td>
                    <td>
                      <span className={`badge ${student.payment_status === 'Payé' || student.payment_status === 'Payé' ? 'badge-success' : 'badge-danger'}`}>
                        {student.payment_status === 'Payé' || student.payment_status === 'Payé' ? t('paid') : t('unpaid')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                         <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setViewStudentId(student.id)} title={t('view')}><FiEye /></button>
                         <button className="btn" style={{ padding: '0.5rem', backgroundColor: '#FEF3C7', color: '#92400E' }} onClick={() => openEditModal(student)} title={t('edit')}><FiEdit /></button>
                         <button className="btn" style={{ padding: '0.5rem', backgroundColor: '#FEE2E2', color: '#991B1B' }} onClick={() => handleDeleteStudent(student.id)} title={t('delete')}><FiTrash2 /></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2rem' }}>{editingStudent ? t('edit') : t('add_student')}</h2>
            <form onSubmit={handleAddStudent}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t('name')}</label>
                <input required type="text" className="input-field" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t('cin')}</label>
                <input type="text" className="input-field" value={newStudent.cin} onChange={e => setNewStudent({...newStudent, cin: e.target.value})} />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t('phone')}</label>
                <input type="text" className="input-field" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => { setShowModal(false); setEditingStudent(null); }} style={{ border: '1px solid #E2E8F0' }}>{t('cancel')}</button>
                <button type="submit" className="btn btn-secondary">{editingStudent ? t('save') : t('add_student')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
 
      {viewStudentId && <StudentModal studentId={viewStudentId} onClose={() => setViewStudentId(null)} />}
    </div>
  );
};

export default Students;
