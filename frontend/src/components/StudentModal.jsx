import { useState, useEffect } from 'react';
import api from '../api';
import { FiX, FiCalendar, FiDollarSign, FiAward } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';

const StudentModal = ({ studentId, onClose }) => {
  const { t, lang } = useLanguage();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const res = await api.get(`/api/students/${studentId}`);
        setStudent(res.data);
      } catch (error) {
        console.error('Failed to fetch student details', error);
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchStudentDetails();
  }, [studentId]);


  if (!studentId) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: lang === 'ar' ? 'auto' : '1.5rem', left: lang === 'ar' ? '1.5rem' : 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-medium)' }}
        >
          <FiX size={24} />
        </button>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loading')}</div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {student.name.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {student.name}
                </h2>
                <p style={{ color: 'var(--text-medium)', margin: 0 }}>
                  {student.cin ? `${t('cin')}: ${student.cin}` : 'No CIN'} | {student.phone || 'No phone'}
                </p>
              </div>
            </div>

            {student.billing_details && (
              <div style={{ marginBottom: '2rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>{t('billing_details')}</h3>
                <table style={{ width: '100%', textAlign: lang === 'ar' ? 'right' : 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB', color: 'var(--text-medium)' }}>
                      <th style={{ padding: '0.5rem 0' }}>{t('category')}</th>
                      <th style={{ padding: '0.5rem 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>{t('pricing')} (DT)</th>
                      <th style={{ padding: '0.5rem 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>{t('paid')} (DT)</th>
                      <th style={{ padding: '0.5rem 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>{t('remaining')} (DT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Conduite */}
                    {(student.billing_details.conduite.hours > 0 || student.billing_details.conduite.paid > 0) && (
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '0.75rem 0' }}>
                          {t('lessons')} Conduite ({student.billing_details.conduite.count || 0} {lang === 'ar' ? 'حصة' : 'sessions'} - {Number(student.billing_details.conduite.hours)} h)
                        </td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>{student.billing_details.conduite.cost}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', color: '#10B981' }}>{student.billing_details.conduite.paid}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 'bold', color: student.billing_details.conduite.cost - student.billing_details.conduite.paid > 0 ? '#DC2626' : '#059669' }}>
                          {student.billing_details.conduite.cost - student.billing_details.conduite.paid}
                        </td>
                      </tr>
                    )}
                    {/* Parking */}
                    {(student.billing_details.parking.hours > 0 || student.billing_details.parking.paid > 0) && (
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '0.75rem 0' }}>
                          {t('lessons')} Parking ({student.billing_details.parking.count || 0} {lang === 'ar' ? 'حصة' : 'sessions'} - {Number(student.billing_details.parking.hours)} h)
                        </td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>{student.billing_details.parking.cost}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', color: '#10B981' }}>{student.billing_details.parking.paid}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 'bold', color: student.billing_details.parking.cost - student.billing_details.parking.paid > 0 ? '#DC2626' : '#059669' }}>
                          {student.billing_details.parking.cost - student.billing_details.parking.paid}
                        </td>
                      </tr>
                    )}
                    {/* Examen Code */}
                    {(student.billing_details.exam_code.count > 0 || student.billing_details.exam_code.paid > 0) && (
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '0.75rem 0' }}>Examen Code ({student.billing_details.exam_code.count})</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>{student.billing_details.exam_code.cost}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', color: '#10B981' }}>{student.billing_details.exam_code.paid}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 'bold', color: student.billing_details.exam_code.cost - student.billing_details.exam_code.paid > 0 ? '#DC2626' : '#059669' }}>
                          {student.billing_details.exam_code.cost - student.billing_details.exam_code.paid}
                        </td>
                      </tr>
                    )}
                    {/* Examen Conduite */}
                    {(student.billing_details.exam_driving.count > 0 || student.billing_details.exam_driving.paid > 0) && (
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '0.75rem 0' }}>Examen Conduite ({student.billing_details.exam_driving.count})</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>{student.billing_details.exam_driving.cost}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', color: '#10B981' }}>{student.billing_details.exam_driving.paid}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 'bold', color: student.billing_details.exam_driving.cost - student.billing_details.exam_driving.paid > 0 ? '#DC2626' : '#059669' }}>
                          {student.billing_details.exam_driving.cost - student.billing_details.exam_driving.paid}
                        </td>
                      </tr>
                    )}
                    {/* Examen Parking */}
                    {(student.billing_details.exam_parking.count > 0 || student.billing_details.exam_parking.paid > 0) && (
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '0.75rem 0' }}>Examen Parking ({student.billing_details.exam_parking.count})</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>{student.billing_details.exam_parking.cost}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', color: '#10B981' }}>{student.billing_details.exam_parking.paid}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 'bold', color: student.billing_details.exam_parking.cost - student.billing_details.exam_parking.paid > 0 ? '#DC2626' : '#059669' }}>
                          {student.billing_details.exam_parking.cost - student.billing_details.exam_parking.paid}
                        </td>
                      </tr>
                    )}
                    {/* Code */}
                    {(student.billing_details.code_hours.hours > 0 || student.billing_details.code_hours.paid > 0) && (
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '0.75rem 0' }}>
                          {t('lessons')} Code ({student.billing_details.code_hours.count || 0} {lang === 'ar' ? 'حصة' : 'sessions'} - {Number(student.billing_details.code_hours.hours)} h)
                        </td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>{student.billing_details.code_hours.cost}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', color: '#10B981' }}>{student.billing_details.code_hours.paid}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 'bold', color: student.billing_details.code_hours.cost - student.billing_details.code_hours.paid > 0 ? '#DC2626' : '#059669' }}>
                          {student.billing_details.code_hours.cost - student.billing_details.code_hours.paid}
                        </td>
                      </tr>
                    )}
                    {/* Autre */}
                    {student.billing_details.autre.paid > 0 && (
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '0.75rem 0' }}>{t('other')}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>0</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', color: '#10B981' }}>{student.billing_details.autre.paid}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 'bold', color: '#059669' }}>
                          -{student.billing_details.autre.paid}
                        </td>
                      </tr>
                    )}
                    {/* Total */}
                    <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--bg-light)' }}>
                      <td style={{ padding: '1rem 0' }}>{t('total_global')}</td>
                      <td style={{ padding: '1rem 0', textAlign: lang === 'ar' ? 'left' : 'right' }}>{student.total_cost}</td>
                      <td style={{ padding: '1rem 0', textAlign: lang === 'ar' ? 'left' : 'right', color: '#10B981' }}>{student.total_paid}</td>
                      <td style={{ padding: '1rem 0', textAlign: lang === 'ar' ? 'left' : 'right', color: student.remaining_balance > 0 ? '#DC2626' : '#059669' }}>
                        {student.remaining_balance > 0 ? student.remaining_balance : 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiCalendar /> {t('history')} {t('sessions')}
                </h3>

                {/* Training Sessions List */}
                {student.sessions && student.sessions.filter(s => s.type && !s.type.startsWith('Examen')).length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {(() => {
                      const sessionsByType = {};
                      const trainingSessions = student.sessions.filter(s => s.type && !s.type.startsWith('Examen'));
                      
                      const processedSessions = [...trainingSessions]
                        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                        .map(session => {
                          if (!sessionsByType[session.type]) sessionsByType[session.type] = 0;
                          sessionsByType[session.type] += 1;
                          return { ...session, sessionNumber: sessionsByType[session.type] };
                        })
                        .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
                        
                      return processedSessions.map(session => {
                        const sessionLabel = lang === 'ar' ? 'حصة عدد' : 'Session N°';
                        const typeTranslation = session.type === 'Code' ? (lang === 'ar' ? 'الكود' : 'Code') : 
                                                session.type === 'Conduite' ? (lang === 'ar' ? 'سياقة' : 'Conduite') : 
                                                session.type === 'Parking' ? 'Parking' : session.type;
                        
                        return (
                          <li key={session.id} style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: '500' }}>{typeTranslation} - {sessionLabel} {session.sessionNumber} ({Number(session.duration_hours)}h)</span>
                              <span className={`badge ${session.status === 'completed' ? 'badge-success' : session.status === 'cancelled' ? 'badge-error' : 'badge-info'}`}>
                                {t(session.status)}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>
                              {new Date(session.start_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          </li>
                        );
                      });
                    })()}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-medium)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{t('no_sessions')}</p>
                )}

                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
                  <FiAward /> {t('history')} {t('exams')}
                </h3>
                {/* Exams List */}
                {student.sessions && student.sessions.filter(s => s.type && s.type.startsWith('Examen')).length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
                    {student.sessions.filter(s => s.type && s.type.startsWith('Examen')).map(exam => (
                      <li key={exam.id} style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '700', color: 'var(--primary-blue)' }}>{exam.type}</span>
                          {exam.result ? (
                            <span className={`badge ${exam.result === 'pass' ? 'badge-success' : 'badge-danger'}`}>
                              {t(exam.result)}
                            </span>
                          ) : (
                            <span className="badge badge-info">{t(exam.status)}</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>
                          {new Date(exam.start_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-medium)', fontSize: '0.875rem' }}>{t('no_activity')}</p>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiDollarSign /> {t('history')} {t('payments')}
                </h3>
                {student.payments && student.payments.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {student.payments.map(payment => (
                      <li key={payment.id} style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{payment.payment_type || t('other')}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>{new Date(payment.payment_date).toLocaleDateString()}</div>
                        </div>
                        <span style={{ fontWeight: 'bold', color: '#10B981', display: 'flex', alignItems: 'center' }}>{payment.amount} DT</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-medium)', fontSize: '0.875rem' }}>{t('no_payments')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentModal;

