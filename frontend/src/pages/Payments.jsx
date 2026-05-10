import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { FiPlus, FiDollarSign, FiEye, FiTrash2, FiSearch, FiCheckCircle } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';
import StudentModal from '../components/StudentModal';
import Pagination from '../components/Pagination';

const Payments = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newPayment, setNewPayment] = useState({ student_id: '' });
  const [selectedPayments, setSelectedPayments] = useState([]); 
  const [paymentSearch, setPaymentSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);
  const [tariffs, setTariffs] = useState(null);
  const [viewStudentId, setViewStudentId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTariffs = async () => {
      try {
        const res = await api.get('/api/tariffs');
        setTariffs(res.data);
      } catch (error) { console.error(error); }
    };
    fetchTariffs();
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await api.get(`/api/payments?page=${page}&limit=20&search=${paymentSearch}`);
      setPayments(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) { console.error(error); }
  }, [page, paymentSearch]);


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPayments();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchPayments]);

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

  const handleDeletePayment = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await api.delete(`/api/payments/${id}`);
      fetchPayments();
    } catch (error) { alert(`Erreur: ${error.response?.data?.error || error.message}`); }
  };

  const getStudentCount = (type, student = selectedStudentForPayment) => {
    if (!student) return 0;
    if (type === 'Heures Code') return student.total_code_hours || 0;
    if (type === 'Heures Conduite') return student.total_driving_hours || 0;
    if (type === 'Heures Parking') return student.total_parking_hours || 0;
    if (type === 'Examen Code') return student.count_exam_code || 0;
    if (type === 'Examen Conduite') return student.count_exam_driving || 0;
    if (type === 'Examen Parking') return student.count_exam_parking || 0;
    return 0;
  };

  const calculateDefaultAmount = (type, student = selectedStudentForPayment) => {
    if (!tariffs) return '';
    const count = getStudentCount(type, student);
    let price = 0;
    if (type === 'Heures Code') price = tariffs.code_hour_price;
    else if (type === 'Heures Conduite') price = tariffs.driving_hour_price;
    else if (type === 'Heures Parking') price = tariffs.driving_hour_price;
    else if (type === 'Examen Code') price = tariffs.exam_code_price;
    else if (type === 'Examen Conduite') price = tariffs.exam_driving_price;
    else if (type === 'Examen Parking') price = tariffs.exam_parking_price;
    if (price && count > 0) return (price * count).toString();
    return price ? price.toString() : '';
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!newPayment.student_id) {
      alert("⚠️ لا يمكن تسجيل الدفع!\n\nالسبب: التلميذ ليس مسجلاً في قائمة التلاميذ. يرجى اختيار تلميذ موجود في القائمة.");
      return;
    }
    if (selectedPayments.length === 0) return alert(t('search'));
    if (selectedPayments.some(p => !p.amount || p.amount <= 0)) return alert(t('invalid_amount'));
    setLoading(true);
    try {
      await Promise.all(selectedPayments.map(p => 
        api.post('/api/payments', { student_id: newPayment.student_id, payment_type: p.type, amount: p.amount })
      ));
      setShowModal(false);
      fetchPayments();
      setNewPayment({ student_id: '' });
      setSelectedStudentForPayment(null);
      setSelectedPayments([]);
      setStudentSearch('');
    } catch (error) { console.error(error); alert('Erreur.'); } finally { setLoading(false); }
  };


  const togglePaymentType = (type) => {
    const exists = selectedPayments.find(p => p.type === type);
    if (exists) { setSelectedPayments(selectedPayments.filter(p => p.type !== type)); }
    else { const defaultAmount = calculateDefaultAmount(type); setSelectedPayments([...selectedPayments, { type, amount: defaultAmount }]); }
  };



  const updateAmount = (type, amount) => { setSelectedPayments(selectedPayments.map(p => p.type === type ? { ...p, amount } : p)); };

  const handlePaymentSearchChange = (e) => {
    setPaymentSearch(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.025em' }}>{t('payments')}</h1>
          <p style={{ color: 'var(--text-medium)', fontSize: '1rem' }}>Suivi des transactions financières et règlements.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowModal(true)}>
          <FiPlus /> {t('add_payment')}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '350px' }}>
            <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-medium)' }} />
            <input type="text" placeholder={t('search')} className="input-field" style={{ paddingLeft: '2.8rem' }} value={paymentSearch} onChange={handlePaymentSearchChange} />
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)', fontWeight: '600', textTransform: 'uppercase' }}>{t('total_collected')}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10B981' }}>{payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString()} DT</div>
             </div>
          </div>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('students')}</th>
                <th>{t('category')}</th>
                <th>{t('amount')}</th>
                <th>Date</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F0FDF4', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}><FiDollarSign /></div>
                      <span style={{ fontWeight: '700' }}>{payment.student_name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{payment.payment_type || t('other')}</span></td>
                  <td style={{ fontWeight: '800', color: '#10B981' }}>{Number(payment.amount).toLocaleString()} DT</td>
                  <td>{new Date(payment.payment_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setViewStudentId(payment.student_id)}><FiEye /></button>
                      <button className="btn" style={{ padding: '0.5rem', backgroundColor: '#FEE2E2', color: '#991B1B' }} onClick={() => handleDeletePayment(payment.id)}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-medium)' }}>{t('no_activity')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2rem' }}>{t('add_payment')}</h2>
            <form onSubmit={handleAddPayment}>
              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t('students')}</label>
                <input type="text" className="input-field" placeholder={t('search')} value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }} />
                {showStudentDropdown && studentSearch.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', zIndex: 110, marginTop: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    {students.map(s => (
                      <div key={s.id} style={{ padding: '0.8rem 1rem', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }} onClick={() => { 
                        setNewPayment({...newPayment, student_id: s.id}); 
                        setSelectedStudentForPayment(s); 
                        setStudentSearch(s.name); 
                        setShowStudentDropdown(false); 
                        if (selectedPayments.length > 0) {
                          const updated = selectedPayments.map(p => ({ ...p, amount: calculateDefaultAmount(p.type, s) }));
                          setSelectedPayments(updated);
                        }
                      }}>
                        <div style={{ fontWeight: '600' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>CIN: {s.cin}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>{t('payment_types')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {['Heures Code', 'Heures Conduite', 'Heures Parking', 'Examen Code', 'Examen Conduite', 'Examen Parking', 'Autre'].map(type => (
                    <div key={type} onClick={() => togglePaymentType(type)} style={{ padding: '0.75rem', border: '1px solid', borderColor: selectedPayments.find(p => p.type === type) ? 'var(--primary-blue)' : '#E2E8F0', borderRadius: '12px', cursor: 'pointer', backgroundColor: selectedPayments.find(p => p.type === type) ? '#EFF6FF' : 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid', borderColor: selectedPayments.find(p => p.type === type) ? 'var(--primary-blue)' : '#CBD5E1', backgroundColor: selectedPayments.find(p => p.type === type) ? 'var(--primary-blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedPayments.find(p => p.type === type) && <FiCheckCircle style={{ color: 'white', fontSize: '10px' }} />}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: selectedPayments.find(p => p.type === type) ? 'var(--primary-blue)' : 'var(--text-dark)' }}>{t(type.toLowerCase().replace(/ /g, '_'))}</span>
                    </div>
                  ))}
                </div>

                {selectedPayments.length > 0 && (
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    {selectedPayments.map(p => {
                      const count = getStudentCount(p.type);
                      return (
                        <div key={p.type} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>{t(p.type.toLowerCase().replace(/ /g, '_'))}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: '700' }}>{count} {p.type.includes('Heures') ? t('hours') : t('exams')}</span>
                          </div>
                          <input type="number" className="input-field" style={{ height: '40px' }} value={p.amount} onChange={(e) => updateAmount(p.type, e.target.value)} />
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.125rem', color: 'var(--text-dark)', marginTop: '0.5rem' }}>
                      <span>{t('total_global')}:</span>
                      <span style={{ color: '#10B981' }}>{selectedPayments.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toLocaleString()} DT</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ border: '1px solid #E2E8F0' }}>{t('cancel')}</button>
                <button type="submit" className="btn btn-secondary" disabled={loading}>{loading ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewStudentId && <StudentModal studentId={viewStudentId} onClose={() => setViewStudentId(null)} />}
    </div>
  );
};

export default Payments;
