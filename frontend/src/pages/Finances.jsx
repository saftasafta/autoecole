import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { FiTrendingUp, FiPlus, FiPieChart, FiArrowUpRight, FiArrowDownLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';
import Pagination from '../components/Pagination';

const Finances = () => {
  const { t, lang } = useLanguage();
  const [summary, setSummary] = useState({ revenue: 0, total_expenses: 0, profit: 0 });
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'Rent', date: new Date().toISOString().split('T')[0], description: '' });
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingExpense, setEditingExpense] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const summaryParams = { month: filterMonth, year: filterYear };
      const expensesParams = { month: filterMonth, year: filterYear, page, limit: 10, search: searchTerm };
      const [sumRes, expRes] = await Promise.all([
        api.get('/api/finances/summary', { params: summaryParams }),
        api.get('/api/finances/expenses', { params: expensesParams })
      ]);
      const formattedSummary = {
        revenue: Number(sumRes.data.revenue) || 0,
        total_expenses: Number(sumRes.data.total_expenses) || 0,
        profit: Number(sumRes.data.profit) || 0
      };
      setSummary(formattedSummary);
      setExpenses(expRes.data.data || []);
      setTotalPages(expRes.data.totalPages || 1);
    } catch (error) { console.error('Failed to fetch finance data', error); }
  }, [filterMonth, filterYear, page, searchTerm]);

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    load();
  }, [fetchData]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingExpense) {
        await api.put(`/api/finances/expenses/${editingExpense.id}`, newExpense);
      } else {
        await api.post('/api/finances/expenses', newExpense);
      }
      setShowModal(false);
      setEditingExpense(null);
      setNewExpense({ amount: '', category: 'Rent', date: new Date().toISOString().split('T')[0], description: '' });
      fetchData();
    } catch (err) { 
      alert(err.response?.data?.error || 'Failed to process expense'); 
    } finally { setLoading(false); }
  };

  const handleDeleteExpense = async (id, source) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      const endpoint = source === 'Fleet' ? `/api/vehicles/any/expenses/${id}` : `/api/finances/expenses/${id}`;
      await api.delete(endpoint);
      fetchData();
    } catch (err) { console.error(err); alert('Failed to delete expense'); }
  };


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.025em' }}>{t('finances')}</h1>
          <p style={{ color: 'var(--text-medium)', fontSize: '1rem' }}>{t('finances_desc')}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select className="input-field" style={{ width: '150px', marginBottom: 0 }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">{t('all_months')}</option>
            {Array.from({ length: 12 }, (_, i) => {
              const monthNamesAr = ["جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان", "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
              const name = lang === 'ar' 
                ? monthNamesAr[i] 
                : new Date(2000, i).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' });
              return <option key={i + 1} value={i + 1}>{name}</option>;
            })}
          </select>
          <select className="input-field" style={{ width: '120px', marginBottom: 0 }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            {Array.from({ length: 5 }, (_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus /> {t('add_expense')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '6px solid #10B981' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#DCFCE7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiArrowUpRight size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-medium)', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{t('total_collected')}</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-dark)' }}>{Number(summary.revenue).toLocaleString()} DT</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '6px solid #EF4444' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiArrowDownLeft size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-medium)', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{t('loss')}</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-dark)' }}>{Number(summary.total_expenses).toLocaleString()} DT</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '6px solid var(--primary-blue)', backgroundColor: 'var(--bg-light)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#EFF6FF', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiPieChart size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-medium)', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>{t('profit')}</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: Number(summary.profit) >= 0 ? '#10B981' : '#EF4444' }}>{Number(summary.profit).toLocaleString()} DT</h3>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{t('general_expenses')}</h2>
          <div style={{ position: 'relative', width: '300px' }}>
            <FiTrendingUp style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-medium)' }} />
            <input type="text" className="input-field" placeholder={t('search')} value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} style={{ paddingLeft: '2.8rem', marginBottom: 0 }} />
          </div>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('date')}</th>
                <th>{t('category')}</th>
                <th>{t('description')}</th>
                <th>{t('amount')}</th>
                <th>{t('source')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(ex => (
                <tr key={`${ex.source}-${ex.id}`}>
                  <td style={{ fontWeight: '600' }}>{new Date(ex.date).toLocaleDateString()}</td>
                  <td><span className="badge badge-info">{ex.category}</span></td>
                  <td>{ex.description}</td>
                  <td style={{ fontWeight: '800', color: '#EF4444' }}>{Number(ex.amount).toLocaleString()} DT</td>
                  <td>
                    <span className={`badge ${ex.source === 'Fleet' ? 'badge-warning' : 'badge-info'}`}>
                      {ex.source === 'Fleet' ? t('fleet_source') : t('general_source')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        if (ex.source === 'Fleet') return alert(t('fleet_expense_alert'));
                        setEditingExpense(ex);
                        setNewExpense({ amount: ex.amount, category: ex.category, date: ex.date, description: ex.description });
                        setShowModal(true);
                      }} style={{ padding: '0.4rem', opacity: ex.source === 'Fleet' ? 0.5 : 1 }}>
                        <FiEdit2 size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteExpense(ex.id, ex.source)} style={{ padding: '0.4rem', backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none' }}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-medium)' }}>{t('no_activity')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1.5rem', borderTop: '1px solid #F1F5F9' }}>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '450px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2rem' }}>{editingExpense ? t('edit') : t('add_expense')}</h2>
            <form onSubmit={handleAddExpense}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>{t('amount')} (DT)</label>
                <input required type="number" className="input-field" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>{t('category')}</label>
                <select className="input-field" value={newExpense.category} onChange={e => {
                  const cat = e.target.value;
                  setNewExpense({
                    ...newExpense, 
                    category: cat,
                    description: cat === 'Invoices' ? t('water') : newExpense.description
                  });
                }}>
                  <option value="Rent">{t('rent') || (lang === 'ar' ? 'الكراء' : 'Loyer')}</option>
                  <option value="Salary">{t('salary') || (lang === 'ar' ? 'الرواتب' : 'Salaires')}</option>
                  <option value="Invoices">{t('invoices')}</option>
                  <option value="Repair">{t('repair')}</option>
                  <option value="Other">{t('other') || (lang === 'ar' ? 'أخرى' : 'Autre')}</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>{t('date')}</label>
                <input required type="date" className="input-field" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>{t('description')}</label>
                {newExpense.category === 'Invoices' ? (
                  <select className="input-field" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})}>
                    <option value={t('water')}>{t('water')}</option>
                    <option value={t('electricity')}>{t('electricity')}</option>
                    <option value={t('internet')}>{t('internet')}</option>
                  </select>
                ) : (
                  <input type="text" className="input-field" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => { setShowModal(false); setEditingExpense(null); setNewExpense({ amount: '', category: 'Rent', date: new Date().toISOString().split('T')[0], description: '' }); }} style={{ border: '1px solid #E2E8F0' }}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finances;
