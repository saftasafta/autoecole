import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { FiPlus, FiEye, FiTrash2, FiSearch, FiCalendar, FiEdit, FiXCircle } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';
import StudentModal from '../components/StudentModal';
import Pagination from '../components/Pagination';
import { useCallback } from 'react';

const Exams = () => {
  const { t, lang } = useLanguage();
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [newExam, setNewExam] = useState({ student_id: '', start_time: '', result: '' });
  const [selectedType, setSelectedType] = useState('Examen Code');
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [students, setStudents] = useState([]); // Search results for dropdown
  const [viewStudentId, setViewStudentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [allExams, setAllExams] = useState([]);
  const [allExamsSearch, setAllExamsSearch] = useState('');
  const [allExamsPage, setAllExamsPage] = useState(1);
  const [allExamsTotalPages, setAllExamsTotalPages] = useState(1);
  const [editingExam, setEditingExam] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [clearSessionsId, setClearSessionsId] = useState(null);

  useEffect(() => {
    fetchExams();
    fetchInstructors();
  }, []);

  useEffect(() => {
    const searchStudentAPI = async () => {
      if (studentSearch.length > 1) {
        try {
          const res = await api.get(`/api/students?limit=5&search=${studentSearch}`);
          setStudents(res.data.data || []);
        } catch (e) { console.error(e); }
      }
    };
    const delay = setTimeout(searchStudentAPI, 300);
    return () => clearTimeout(delay);
  }, [studentSearch]);


  const existingExamsOnDay = useMemo(() => {
    if (!newExam.student_id || !newExam.start_time) {
      return [];
    }
    const selectedDate = newExam.start_time.split('T')[0];
    return allExams.filter(ex =>
      ex.student_id === newExam.student_id &&
      ex.status !== 'cancelled' &&
      ex.start_time.split('T')[0] === selectedDate
    );
  }, [newExam.student_id, newExam.start_time, allExams]);

  const filteredExams = exams.filter(exam => {
    if (filterType === 'all') return true;
    return exam.type === filterType;
  });

  async function fetchExams() {
    try {
      const res = await api.get('/api/exams/today');
      setExams(res.data);
    } catch { console.error('Failed to fetch exams'); }
  }


  const fetchAllExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/exams/all?page=${allExamsPage}&limit=20&search=${allExamsSearch}`);
      setAllExams(res.data.data);
      setAllExamsTotalPages(res.data.totalPages);
    } catch (error) { 
      alert(error.response?.data?.error || `Erreur.`); 
    } finally { 
      setLoading(false); 
    }
  }, [allExamsPage, allExamsSearch]);

  useEffect(() => {
    if (showAllModal) {
      const delay = setTimeout(fetchAllExams, 300);
      return () => clearTimeout(delay);
    }
  }, [fetchAllExams, showAllModal]);

  const openAllExams = () => {
    setAllExamsPage(1);
    setAllExamsSearch('');
    setShowAllModal(true);
  };




  async function fetchInstructors() {
    try {
      const res = await api.get('/api/instructors');
      setInstructors(res.data);
    } catch { console.error('Failed to fetch instructors'); }
  }


  const handleDeleteExam = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await api.delete(`/api/sessions/${id}`);
      fetchExams();
      if (showAllModal) {
        const res = await api.get('/api/exams/all');
        setAllExams(res.data.data);
      }
    } catch (error) { alert(`Erreur: ${error.response?.data?.error || error.message}`); }
  };
  const handleClearExams = async (type) => {
    if (!clearSessionsId || clearSessionsId === 'new') return alert(t('select_student'));
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await api.delete(`/api/student-maintenance/${clearSessionsId}/clear-exams?type=${type}`);
      setClearSessionsId(null);
      setStudentSearch('');
      fetchExams();
      if (showAllModal) fetchAllExams();
    } catch (error) { alert(`Erreur: ${error.response?.data?.error || error.message}`); }
  };


  const openEditModal = (exam) => {
    setEditingExam(exam);
    setNewExam({
      student_id: exam.student_id,
      start_time: exam.start_time.replace(' ', 'T').substring(0, 16), // Format for datetime-local
      result: exam.result || '',
      instructor_id: exam.instructor_id || ''
    });
    setSelectedType(exam.type);
    setStudentSearch(exam.student_name);
    setShowModal(true);
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!newExam.student_id) {
      alert(t('student_not_found_alert'));
      return;
    }
    if (!newExam.start_time) return alert(t('search'));
    const selectedDate = newExam.start_time.split('T')[0];
    const studentExamsOnDay = allExams.filter(ex => ex.student_id === newExam.student_id && ex.status !== 'cancelled' && ex.start_time.split('T')[0] === selectedDate);
    if (studentExamsOnDay.some(ex => ex.type === selectedType)) return alert(t('already_registered'));
    if (studentExamsOnDay.length >= 3) return alert('Max 3 exams per day');
    setLoading(true);
    try {
      const payload = { 
        student_id: newExam.student_id, 
        instructor_id: newExam.instructor_id || null,
        type: selectedType, 
        start_time: newExam.start_time, 
        duration_hours: 1, 
        status: newExam.result ? 'completed' : (editingExam ? editingExam.status : 'scheduled'),
        result: newExam.result || null
      };

      if (editingExam) {
        await api.put(`/api/sessions/${editingExam.id}`, payload);
      } else {
        await api.post('/api/sessions', payload);
      }
      
      setShowModal(false);
      setEditingExam(null);
      setNewExam({ student_id: '', start_time: '', instructor_id: '' });
      setStudentSearch('');
      fetchExams();
      if (showAllModal) {
        const res = await api.get('/api/exams/all');
        setAllExams(res.data.data);
      }
    } catch (error) { alert(error.response?.data?.error || `Erreur.`); } finally { setLoading(false); }
  };


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.025em' }}>{t('today_exams')}</h1>
          <p style={{ color: 'var(--text-medium)', fontSize: '1rem' }}>{t('exams_desc')}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ backgroundColor: '#F3E8FF', color: '#6B21A8' }} onClick={() => setClearSessionsId('new')}>
             <FiXCircle /> {t('clear_exam')}
          </button>
          <button className="btn btn-secondary" onClick={openAllExams}>
            <FiCalendar /> {t('all_exams')}
          </button>
          <button className="btn btn-primary" onClick={async () => {
            try {
              const res = await api.get('/api/exams/all');
              setAllExams(res.data.data);
            } catch (e) {
              console.error(e);
            }

            setEditingExam(null);
            setNewExam({ student_id: '', start_time: '', instructor_id: '' });
            setStudentSearch('');
            setShowModal(true);
          }}>
            <FiPlus /> {t('register_exam')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {['all', 'Examen Code', 'Examen Conduite', 'Examen Parking'].map(type => (
          <button key={type} className="btn" style={{ fontSize: '0.875rem', padding: '0.6rem 1.2rem', backgroundColor: filterType === type ? 'var(--primary-blue)' : 'white', color: filterType === type ? 'white' : 'var(--text-medium)', border: '1px solid #E2E8F0', borderRadius: '12px' }} onClick={() => setFilterType(type)}>
            {type === 'all' ? t('all') : type}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('cin')}</th>
                <th>{t('exam_type')}</th>
                <th>{t('status')}</th>
                <th>{t('date_time')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.map(exam => (
                <tr key={exam.id}>
                  <td style={{ fontWeight: '700' }}>{exam.student_name}</td>
                  <td>{exam.student_cin || 'N/A'}</td>
                  <td>{exam.type}</td>
                  <td>
                    <select 
                      className={`badge ${exam.result === 'pass' ? 'badge-success' : exam.result === 'fail' ? 'badge-danger' : 'badge-info'}`}
                      style={{ border: 'none', cursor: 'pointer', outline: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: '1rem', textAlign: 'center' }}
                      value={exam.result || ''}
                      onChange={async (e) => {
                        try {
                          await api.put(`/api/sessions/${exam.id}`, { ...exam, result: e.target.value || null, status: e.target.value ? 'completed' : 'scheduled' });
                          fetchExams();
                          if (showAllModal) {
                            const res = await api.get('/api/exams/all');
                            setAllExams(res.data.data);
                          }
                        } catch { alert('Error updating result'); }
                      }}
                    >
                      <option value="" style={{ color: 'black' }}>{t('pending')}</option>
                      <option value="pass" style={{ color: 'black' }}>{t('pass')}</option>
                      <option value="fail" style={{ color: 'black' }}>{t('fail')}</option>
                    </select>
                  </td>
                  <td>{new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                       <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setViewStudentId(exam.student_id)}><FiEye /></button>
                       <button className="btn" style={{ padding: '0.5rem', backgroundColor: '#FEF3C7', color: '#92400E' }} onClick={() => openEditModal(exam)}><FiEdit /></button>
                       <button className="btn" style={{ padding: '0.5rem', backgroundColor: '#FEE2E2', color: '#991B1B' }} onClick={() => handleDeleteExam(exam.id)}><FiTrash2 /></button>
                     </div>
                  </td>
                </tr>
              ))}
              {filteredExams.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-medium)' }}>{t('no_activity')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '450px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2rem' }}>{editingExam ? t('edit') : t('register_exam')}</h2>
            <form onSubmit={handleAddExam}>
              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t('students')}</label>
                <input type="text" className="input-field" placeholder={t('search')} value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }} />
                {showStudentDropdown && studentSearch.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', zIndex: 110, marginTop: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    {students.map(s => (
                      <div key={s.id} style={{ padding: '0.8rem 1rem', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }} onClick={() => { setNewExam({...newExam, student_id: s.id}); setStudentSearch(s.name); setShowStudentDropdown(false); }}>
                        <div style={{ fontWeight: '600' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>CIN: {s.cin}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t('date_time')}</label>
                <input required type="datetime-local" className="input-field" value={newExam.start_time} onChange={e => setNewExam({...newExam, start_time: e.target.value})} />
              </div>

              {existingExamsOnDay.length > 0 && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: existingExamsOnDay.length >= 3 ? '#FEF2F2' : '#FFF7ED', border: `1px solid ${existingExamsOnDay.length >= 3 ? '#FECACA' : '#FED7AA'}`, borderRadius: '12px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.8rem', color: existingExamsOnDay.length >= 3 ? '#991B1B' : '#92400E', marginBottom: '0.5rem' }}>
                    {existingExamsOnDay.length >= 3 ? '🚫 Limit reached' : `⚠️ Already registered (${existingExamsOnDay.length}/3)`}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t('exam_type')}</label>
                <select className="input-field" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                  <option value="Examen Code">Examen Code</option>
                  <option value="Examen Conduite">Examen Conduite</option>
                  <option value="Examen Parking">Examen Parking</option>
                </select>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t('responsible_instructor')}</label>
                <select className="input-field" value={newExam.instructor_id || ''} onChange={e => setNewExam({...newExam, instructor_id: e.target.value})}>
                  <option value="">{t('unspecified')}</option>
                  {instructors.map(i => <option key={i.instructor_id} value={i.instructor_id}>{i.name}</option>)}
                </select>
              </div>


              {editingExam && (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t('result')}</label>
                <select className="input-field" value={newExam.result} onChange={e => setNewExam({...newExam, result: e.target.value})}>
                  <option value="">-- {t('pending')} --</option>
                  <option value="pass" style={{ color: '#166534', fontWeight: 'bold' }}>{t('pass')}</option>
                  <option value="fail" style={{ color: '#991B1B', fontWeight: 'bold' }}>{t('fail')}</option>
                </select>
              </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => { setShowModal(false); setEditingExam(null); }} style={{ border: '1px solid #E2E8F0' }}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={loading || (existingExamsOnDay.length >= 3 && !editingExam)}>{loading ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAllModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{t('all_exams')}</h2>
              <button className="btn btn-secondary" onClick={() => setShowAllModal(false)}>{t('cancel')}</button>
            </div>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-medium)' }} />
              <input type="text" className="input-field" placeholder={t('search')} value={allExamsSearch} onChange={e => { setAllExamsSearch(e.target.value); setAllExamsPage(1); }} style={{ paddingLeft: '2.8rem' }} />
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('cin')}</th>
                    <th>{t('exam_type')}</th>
                    <th>{t('status')}</th>
                    <th>{t('date_time')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allExams.map(exam => (
                    <tr key={exam.id}>
                      <td style={{ fontWeight: '700' }}>{exam.student_name}</td>
                      <td>{exam.student_cin}</td>
                      <td>{exam.type}</td>
                      <td>
                        <select 
                          className={`badge ${exam.result === 'pass' ? 'badge-success' : exam.result === 'fail' ? 'badge-danger' : 'badge-info'}`}
                          style={{ border: 'none', cursor: 'pointer', outline: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: '1rem', textAlign: 'center' }}
                          value={exam.result || ''}
                          onChange={async (e) => {
                            try {
                              await api.put(`/api/sessions/${exam.id}`, { ...exam, result: e.target.value || null, status: e.target.value ? 'completed' : 'scheduled' });
                              fetchExams();
                              fetchAllExams();
                            } catch { alert('Error updating result'); }
                          }}
                        >
                          <option value="" style={{ color: 'black' }}>{t('pending')}</option>
                          <option value="pass" style={{ color: 'black' }}>{t('pass')}</option>
                          <option value="fail" style={{ color: 'black' }}>{t('fail')}</option>
                        </select>
                      </td>
                      <td>{new Date(exam.start_time).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                           <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setViewStudentId(exam.student_id)}><FiEye /></button>
                           <button className="btn" style={{ padding: '0.5rem', backgroundColor: '#FEF3C7', color: '#92400E' }} onClick={() => openEditModal(exam)}><FiEdit /></button>
                           <button className="btn" style={{ padding: '0.5rem', backgroundColor: '#FEE2E2', color: '#991B1B' }} onClick={() => handleDeleteExam(exam.id)}><FiTrash2 /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '2rem' }}>
               <Pagination page={allExamsPage} totalPages={allExamsTotalPages} onPageChange={setAllExamsPage} />
            </div>
          </div>
        </div>
      )}

       {clearSessionsId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div className="card" style={{ width: '450px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>{t('clear_exam')}</h2>
            
            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
               <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t('select_student')}</label>
               <input type="text" className="input-field" placeholder={t('search')} value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }} />
               {showStudentDropdown && studentSearch.length > 0 && (
                 <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', zIndex: 110, marginTop: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                   {students.map(s => (
                     <div key={s.id} style={{ padding: '0.8rem 1rem', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }} onClick={() => { setClearSessionsId(s.id); setStudentSearch(s.name); setShowStudentDropdown(false); }}>
                       <div style={{ fontWeight: '600' }}>{s.name}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>CIN: {s.cin}</div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

            <p style={{ marginBottom: '1rem', color: 'var(--text-medium)', fontSize: '0.9rem' }}>{lang === 'ar' ? 'اختر أنواع الامتحانات المراد مسحها:' : 'Choisissez les types d\'examens à supprimer :'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button className="btn" style={{ justifyContent: 'center', backgroundColor: '#F3F4F6' }} onClick={() => handleClearExams('all')}>{t('delete_all_exams')}</button>
              <button className="btn" style={{ justifyContent: 'center', backgroundColor: '#EFF6FF' }} onClick={() => handleClearExams('Code')}>{t('delete_code_exam')}</button>
              <button className="btn" style={{ justifyContent: 'center', backgroundColor: '#F5F3FF' }} onClick={() => handleClearExams('Conduite')}>{t('delete_conduite_exam')}</button>
              <button className="btn" style={{ justifyContent: 'center', backgroundColor: '#FFF7ED' }} onClick={() => handleClearExams('Parking')}>{t('delete_parking_exam')}</button>
            </div>
            <hr style={{ margin: '1.5rem 0', borderColor: '#F1F5F9' }} />
            <button className="btn w-full" style={{ justifyContent: 'center' }} onClick={() => { setClearSessionsId(null); setStudentSearch(''); }}>{t('cancel')}</button>
          </div>
        </div>
       )}
 
       {viewStudentId && <StudentModal studentId={viewStudentId} onClose={() => setViewStudentId(null)} />}
    </div>
  );
};

export default Exams;
