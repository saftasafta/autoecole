import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiXCircle } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';
import Pagination from '../components/Pagination';
import StudentModal from '../components/StudentModal';

const Sessions = () => {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [newSession, setNewSession] = useState({
    student_id: '',
    instructor_id: '',
    vehicle_id: '',
    type: 'Conduite',
    duration_hours: 1,
    start_time: '',
    status: 'scheduled',
    frequency: 'once',
    num_days: 1
  });

  const [filterType, setFilterType] = useState('all');
  const [allSessions, setAllSessions] = useState([]);
  const [allSessionsSearch, setAllSessionsSearch] = useState('');
  const [allSessionsPage, setAllSessionsPage] = useState(1);
  const [allSessionsTotalPages, setAllSessionsTotalPages] = useState(1);
  
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [viewStudentId, setViewStudentId] = useState(null);
  const [clearSessionsId, setClearSessionsId] = useState(null);

  const fetchTodaySessions = useCallback(async () => {
    try {
      const res = await api.get('/api/sessions/today');
      setSessions(res.data);
    } catch (error) {
      console.error('Data fetch error', error);
    }
  }, []);

  const fetchAllSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/sessions?page=${allSessionsPage}&limit=20&search=${allSessionsSearch}`);
      if (res.data && res.data.data) {
        setAllSessions(res.data.data.filter(s => s.type && !s.type.startsWith('Examen')));
        setAllSessionsTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.error('Data fetch error', error);
    } finally {
      setLoading(false);
    }
  }, [allSessionsPage, allSessionsSearch]);

  useEffect(() => {
    const init = async () => {
      await fetchTodaySessions();
      try {
        const [instructorsRes, vehiclesRes] = await Promise.all([
          api.get('/api/instructors'),
          api.get('/api/vehicles')
        ]);
        setInstructors(Array.isArray(instructorsRes.data) ? instructorsRes.data : []);
        setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data.filter(v => v.status === 'active') : []);
      } catch (error) { console.error(error); }
    };
    init();
  }, [fetchTodaySessions]);

  useEffect(() => {
    if (showAllModal) {
      const delay = setTimeout(fetchAllSessions, 300);
      return () => clearTimeout(delay);
    }
  }, [fetchAllSessions, showAllModal]);

  useEffect(() => {
    const searchStudentAPI = async () => {
      if (studentSearch.length > 0 && showStudentDropdown) {
        try {
          const res = await api.get(`/api/students?limit=5&search=${studentSearch}`);
          setStudents(res.data.data || []);
        } catch (e) { console.error(e); }
      }
    };
    const delay = setTimeout(searchStudentAPI, 300);
    return () => clearTimeout(delay);
  }, [studentSearch, showStudentDropdown]);


  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!newSession.student_id) {
      alert(t('select_student_error'));
      return;
    }

    if (!newSession.start_time) {
      alert("⚠️ يرجى اختيار التاريخ والوقت.");
      return;
    }

    setLoading(true);
    try {
      const formattedSession = {
        ...newSession,
        instructor_id: newSession.instructor_id || null,
        vehicle_id: newSession.vehicle_id || null,
        duration_hours: parseFloat(newSession.duration_hours) || 1
      };

      if (editingSession) {
        await api.put(`/api/sessions/${editingSession.id}`, formattedSession);
      } else {
        if (newSession.frequency === 'daily') {
          const numDays = parseInt(newSession.num_days) || 1;
          const sessionsToCreate = [];
          const [baseDate, baseTime] = newSession.start_time.split('T');
          
          for (let i = 0; i < numDays; i++) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() + i);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const startTime = `${year}-${month}-${day}T${baseTime}`;
            
            sessionsToCreate.push({
              ...formattedSession,
              start_time: startTime
            });
          }
          await Promise.all(sessionsToCreate.map(s => api.post('/api/sessions', s)));
        } else {
          await api.post('/api/sessions', formattedSession);
        }
      }
      setShowModal(false);
      setEditingSession(null);
      fetchTodaySessions();
      if (showAllModal) fetchAllSessions();
    } catch (error) {
      alert(error.response?.data?.error || 'Error');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await api.delete(`/api/sessions/${id}`);
      fetchTodaySessions();
      if (showAllModal) fetchAllSessions();
    } catch {
      alert('Delete failed');
    }
  };

  const handleClearSessions = async (type) => {
    if (!clearSessionsId || clearSessionsId === 'new') return alert(t('select_student'));
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await api.delete(`/api/student-maintenance/${clearSessionsId}/clear-sessions?type=${type}`);
      setClearSessionsId(null);
      setStudentSearch('');
      fetchTodaySessions();
      if (showAllModal) fetchAllSessions();
    } catch (error) { alert(`Erreur: ${error.response?.data?.error || error.message}`); }
  };


  const filteredTodaySessions = sessions.filter(s => {
    if (filterType === 'all') return true;
    return s.type === filterType;
  });

  const openAllSessions = () => {
    setAllSessionsPage(1);
    setAllSessionsSearch('');
    setShowAllModal(true);
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.025em' }}>{t('today_sessions')}</h1>
          <p style={{ color: 'var(--text-medium)', fontSize: '1rem' }}>{t('sessions_desc')}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn" style={{ backgroundColor: '#F3E8FF', color: '#6B21A8' }} onClick={() => setClearSessionsId('new')}>
            <FiXCircle /> {t('clear_sessions')}
          </button>
          <button className="btn btn-secondary" onClick={openAllSessions}>
            <FiSearch /> {t('all_sessions')}
          </button>
          <button className="btn btn-primary" onClick={() => {
            setEditingSession(null);
            setNewSession({ student_id: '', instructor_id: '', vehicle_id: '', type: 'Conduite', duration_hours: 1, start_time: '', status: 'scheduled', frequency: 'once', num_days: 1 });
            setStudentSearch('');
            setShowModal(true);
          }}>
            <FiPlus /> {t('add_session')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {['all', 'Code', 'Conduite', 'Parking'].map(type => (
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
                <th>CIN</th>
                <th>{t('category')}</th>
                <th>{t('duration')}</th>
                <th>{t('status')}</th>
                <th>{t('date_time')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTodaySessions.map(session => (
                <tr key={session.id}>
                  <td style={{ fontWeight: '700' }}>{session.student_name}</td>
                  <td>{session.student_cin || 'N/A'}</td>
                  <td>{session.type}</td>
                  <td>{session.duration_hours} h</td>
                  <td>
                    <select 
                      className={`badge ${session.status === 'completed' ? 'badge-success' : session.status === 'cancelled' ? 'badge-error' : 'badge-info'}`}
                      style={{ border: 'none', cursor: 'pointer', outline: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: '1rem', textAlign: 'center' }}
                      value={session.status}
                      onChange={async (e) => {
                        try {
                          await api.put(`/api/sessions/${session.id}`, { ...session, status: e.target.value });
                          fetchTodaySessions();
                        } catch { alert('Error updating status'); }
                      }}
                    >
                      <option value="scheduled" style={{ color: 'black' }}>{t('scheduled')}</option>
                      <option value="completed" style={{ color: 'black' }}>{t('completed')}</option>
                      <option value="cancelled" style={{ color: 'black' }}>{t('cancelled')}</option>
                    </select>
                  </td>
                  <td>{new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => setViewStudentId(session.student_id)}>
                        <FiEye />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => {
                        setEditingSession(session);
                        setNewSession({ ...session, start_time: session.start_time.replace(' ', 'T').slice(0, 16) });
                        setStudentSearch(session.student_name);
                        setShowModal(true);
                      }}>
                        <FiEdit />
                      </button>
                      <button className="btn" style={{ padding: '0.4rem', backgroundColor: '#FEE2E2', color: '#991B1B' }} onClick={() => handleDelete(session.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTodaySessions.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-medium)' }}>{t('no_sessions')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAllModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '1000px', height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{t('all_sessions')}</h2>
              <button className="btn" onClick={() => setShowAllModal(false)} style={{ padding: '0.5rem' }}><FiXCircle size={24} /></button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', maxWidth: '400px' }}>
                <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-medium)' }} />
                <input 
                  type="text" 
                  placeholder={t('search_student')} 
                  className="input-field" 
                  style={{ paddingLeft: '2.8rem', marginBottom: 0 }} 
                  value={allSessionsSearch} 
                  onChange={(e) => { setAllSessionsSearch(e.target.value); setAllSessionsPage(1); }} 
                />
              </div>
            </div>

            <div className="data-table-container" style={{ flex: 1, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>CIN</th>
                    <th>{t('category')}</th>
                    <th>{t('duration')}</th>
                    <th>{t('status')}</th>
                    <th>{t('date_time')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allSessions.map(session => (
                    <tr key={session.id}>
                      <td style={{ fontWeight: '700' }}>{session.student_name}</td>
                      <td>{session.student_cin || 'N/A'}</td>
                      <td>{session.type}</td>
                      <td>{session.duration_hours} h</td>
                      <td>
                        <select 
                          className={`badge ${session.status === 'completed' ? 'badge-success' : session.status === 'cancelled' ? 'badge-error' : 'badge-info'}`}
                          style={{ border: 'none', cursor: 'pointer', outline: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: '1rem', textAlign: 'center' }}
                          value={session.status}
                          onChange={async (e) => {
                            try {
                              await api.put(`/api/sessions/${session.id}`, { ...session, status: e.target.value });
                              fetchTodaySessions();
                              fetchAllSessions();
                            } catch { alert('Error updating status'); }
                          }}
                        >
                          <option value="scheduled" style={{ color: 'black' }}>{t('scheduled')}</option>
                          <option value="completed" style={{ color: 'black' }}>{t('completed')}</option>
                          <option value="cancelled" style={{ color: 'black' }}>{t('cancelled')}</option>
                        </select>
                      </td>
                      <td>{new Date(session.start_time).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => setViewStudentId(session.student_id)}>
                            <FiEye />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => {
                            setEditingSession(session);
                            setNewSession({ ...session, start_time: session.start_time.replace(' ', 'T').slice(0, 16) });
                            setStudentSearch(session.student_name);
                            setShowModal(true);
                          }}>
                            <FiEdit />
                          </button>
                          <button className="btn" style={{ padding: '0.4rem', backgroundColor: '#FEE2E2', color: '#991B1B' }} onClick={() => handleDelete(session.id)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <Pagination page={allSessionsPage} totalPages={allSessionsTotalPages} onPageChange={setAllSessionsPage} />
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingSession ? t('edit') : t('add_session')}</h2>
            <form onSubmit={handleAddSession}>
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{t('students')}</label>
                <input type="text" className="input-field" placeholder={t('search_student')} value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }} />
                {showStudentDropdown && studentSearch.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', zIndex: 110, marginTop: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    {students.map(s => (
                      <div key={s.id} style={{ padding: '0.8rem 1rem', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }} onClick={() => { setNewSession({...newSession, student_id: s.id}); setStudentSearch(s.name); setShowStudentDropdown(false); }}>
                        <div style={{ fontWeight: '600' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>CIN: {s.cin}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{t('instructor')}</label>
                  <select className="input-field" value={newSession.instructor_id} onChange={(e) => setNewSession({...newSession, instructor_id: e.target.value})}>
                    <option value="">{t('all')}</option>
                    {instructors.map(i => <option key={i.instructor_id} value={i.instructor_id}>{i.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{t('vehicle')}</label>
                  <select className="input-field" value={newSession.vehicle_id} onChange={(e) => setNewSession({...newSession, vehicle_id: e.target.value})}>
                    <option value="">{t('all')}</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.model}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{t('category')}</label>
                  <select className="input-field" value={newSession.type} onChange={(e) => setNewSession({...newSession, type: e.target.value})}>
                    <option value="Conduite">Conduite</option>
                    <option value="Parking">Parking</option>
                    <option value="Code">Code</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{t('duration')}</label>
                  <input type="number" step="0.5" className="input-field" value={newSession.duration_hours} onChange={(e) => setNewSession({...newSession, duration_hours: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{t('date_time')}</label>
                  <input type="datetime-local" className="input-field" value={newSession.start_time} onChange={(e) => setNewSession({...newSession, start_time: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{t('status')}</label>
                  <select className="input-field" value={newSession.status} onChange={(e) => setNewSession({...newSession, status: e.target.value})}>
                    <option value="scheduled">{t('scheduled')}</option>
                    <option value="completed">{t('completed')}</option>
                    <option value="cancelled">{t('cancelled')}</option>
                  </select>
                </div>
              </div>

              {!editingSession && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#F1F5F9', borderRadius: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{t('repetition')}</label>
                    <select className="input-field" value={newSession.frequency} onChange={(e) => setNewSession({...newSession, frequency: e.target.value})}>
                      <option value="once">{t('once')}</option>
                      <option value="daily">{t('daily')}</option>
                    </select>
                  </div>
                  {newSession.frequency === 'daily' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>{t('num_days')}</label>
                      <input type="number" min="1" max="30" className="input-field" value={newSession.num_days} onChange={(e) => setNewSession({...newSession, num_days: e.target.value})} />
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {clearSessionsId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="card" style={{ width: '450px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>{t('clear_sessions')}</h2>
            
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

            <p style={{ marginBottom: '1rem', color: 'var(--text-medium)', fontSize: '0.9rem' }}>{t('clear_sessions_desc')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button className="btn" style={{ justifyContent: 'center', backgroundColor: '#F3F4F6' }} onClick={() => handleClearSessions('all')}>{t('delete_all')}</button>
              <button className="btn" style={{ justifyContent: 'center', backgroundColor: '#EFF6FF' }} onClick={() => handleClearSessions('Code')}>{t('delete_code')}</button>
              <button className="btn" style={{ justifyContent: 'center', backgroundColor: '#F5F3FF' }} onClick={() => handleClearSessions('Conduite')}>{t('delete_conduite')}</button>
              <button className="btn" style={{ justifyContent: 'center', backgroundColor: '#FFF7ED' }} onClick={() => handleClearSessions('Parking')}>{t('delete_parking')}</button>
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

export default Sessions;
