import { useState, useEffect } from 'react';
import api from '../api';
import { FiPlus, FiTruck, FiTool, FiActivity, FiSearch, FiAlertTriangle, FiCheckCircle, FiShield, FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';
import { useNotifications } from '../NotificationsContext';

const Fleet = () => {
  const { t } = useLanguage();
  const { refresh: refreshNotifications } = useNotifications();
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [logs, setLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newVehicle, setNewVehicle] = useState({ model: '', registration_plate: '', status: 'active', insurance_expiry: '', tech_inspection_expiry: '', last_oil_change_km: 0, oil_interval: 10000, mileage: 0 });
  const [newLog, setNewLog] = useState({ date: new Date().toISOString().split('T')[0], start_km: '', end_km: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('status');
  const [confirmAction, setConfirmAction] = useState(null); // { vehicleId, type: 'insurance'|'oil'|'tech', vehicle }
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLog, setEditingLog] = useState(null);

  const formatMileage = (num) => { if (!num) return `0 ${t('km') || 'km'}`; return `${num.toLocaleString()} ${t('km') || 'km'}`; };

  const fetchVehicles = async () => {
    try { const res = await api.get('/api/vehicles'); setVehicles(res.data); } catch { console.error('Fetch failed'); }
  };

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    const init = async () => { await fetchVehicles(); };
    init();
  }, []);

  const fetchVehicleDetails = async (id) => {
    try {
      const [lr, er] = await Promise.all([api.get(`/api/vehicles/${id}/logs`), api.get(`/api/vehicles/${id}/expenses`)]);
      setLogs(lr.data); setExpenses(er.data);
    } catch { console.error('Details fetch failed'); }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/api/vehicles', newVehicle);
      setShowModal(false);
      setNewVehicle({ model: '', registration_plate: '', status: 'active', insurance_expiry: '', tech_inspection_expiry: '', last_oil_change_km: 0, oil_interval: 10000, mileage: 0 });
      fetchVehicles(); refreshNotifications();
    } catch { alert('Error adding vehicle'); } finally { setLoading(false); }
  };

  const handleAddLog = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post(`/api/vehicles/${selectedVehicle.id}/logs`, newLog);
      setNewLog({ date: new Date().toISOString().split('T')[0], start_km: '', end_km: '', notes: '' });
      fetchVehicleDetails(selectedVehicle.id); fetchVehicles(); refreshNotifications();
    } catch { alert('Failed to add log'); } finally { setLoading(false); }
  };

  const handleEditLog = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.put(`/api/vehicles/${selectedVehicle.id}/logs/${editingLog.id}`, editingLog);
      setEditingLog(null);
      fetchVehicleDetails(selectedVehicle.id); fetchVehicles(); refreshNotifications();
    } catch { alert('Failed to update log'); } finally { setLoading(false); }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm(t('confirm_delete') || 'Are you sure?')) return;
    try {
      await api.delete(`/api/vehicles/${selectedVehicle.id}/logs/${logId}`);
      fetchVehicleDetails(selectedVehicle.id); fetchVehicles(); refreshNotifications();
    } catch { alert('Failed to delete log'); }
  };

  const handleDeleteExpense = async (id, source) => {
    if (!window.confirm(t('confirm_delete') || 'Are you sure?')) return;
    try {
      const endpoint = source === 'Fleet' ? `/api/vehicles/any/expenses/${id}` : `/api/finances/expenses/${id}`;
      await api.delete(endpoint);
      if (selectedVehicle) fetchVehicleDetails(selectedVehicle.id);
      fetchVehicles();
      refreshNotifications();
    } catch (err) { console.error(err); alert('Failed to delete expense'); }
  };

  const handleInsuranceDone = async (vehicle, newDate, amount, description) => {
    try {
      await Promise.all([
        api.put(`/api/vehicles/${vehicle.id}`, { ...vehicle, insurance_expiry: newDate }),
        amount > 0 ? api.post(`/api/vehicles/${vehicle.id}/expenses`, { amount, category: 'Insurance', date: new Date().toISOString().split('T')[0], description: description || 'تأمين' }) : Promise.resolve()
      ]);
      fetchVehicles(); refreshNotifications();
      setConfirmAction(null);
    } catch { alert('Error'); }
  };

  const handleOilDone = async (vehicle, amount, description) => {
    try {
      await Promise.all([
        api.put(`/api/vehicles/${vehicle.id}`, { ...vehicle, last_oil_change_km: vehicle.mileage, status: 'active' }),
        amount > 0 ? api.post(`/api/vehicles/${vehicle.id}/expenses`, { amount, category: 'Repair', date: new Date().toISOString().split('T')[0], description: description || 'تغيير زيت' }) : Promise.resolve()
      ]);
      fetchVehicles(); refreshNotifications();
      setConfirmAction(null);
      if (selectedVehicle?.id === vehicle.id) setSelectedVehicle({ ...vehicle, last_oil_change_km: vehicle.mileage, status: 'active' });
    } catch { alert('Error'); }
  };


  const handleTechDone = async (vehicle, newDate, amount, description) => {
    try {
      await Promise.all([
        api.put(`/api/vehicles/${vehicle.id}`, { ...vehicle, tech_inspection_expiry: newDate }),
        amount > 0 ? api.post(`/api/vehicles/${vehicle.id}/expenses`, { amount, category: 'Repair', date: new Date().toISOString().split('T')[0], description: description || 'فحص فني' }) : Promise.resolve()
      ]);
      fetchVehicles(); refreshNotifications();
      setConfirmAction(null);
      if (selectedVehicle?.id === vehicle.id) setSelectedVehicle({ ...vehicle, tech_inspection_expiry: newDate });
    } catch { alert('Error'); }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm(t('confirm_delete') || 'Are you sure?')) return;
    try {
      await api.delete(`/api/vehicles/${id}`);
      if (selectedVehicle) fetchVehicleDetails(selectedVehicle.id);
      fetchVehicles();
      refreshNotifications();
    } catch { alert('Error deleting vehicle'); }
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.put(`/api/vehicles/${editingVehicle.id}`, editingVehicle);
      setEditingVehicle(null);
      fetchVehicles(); refreshNotifications();
    } catch { alert('Error updating vehicle'); } finally { setLoading(false); }
  };

  const calcOil = (v) => {
    const driven = (v.mileage || 0) - (v.last_oil_change_km || 0);
    const remaining = (v.oil_interval || 10000) - driven;
    const pct = Math.max(0, Math.min(100, (remaining / (v.oil_interval || 10000)) * 100));
    return { remaining, pct };
  };

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    alerts: vehicles.filter(v => {
      const { remaining } = calcOil(v);
      const insDays = daysUntil(v.insurance_expiry);
      const techDays = daysUntil(v.tech_inspection_expiry);
      return remaining <= 0 || (insDays !== null && insDays < 0) || (techDays !== null && techDays < 0);
    }).length
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2.5rem' }}>
        <div>
          <h1 style={{ fontSize:'2.25rem', fontWeight:'900', color:'var(--text-dark)', letterSpacing:'-0.05em' }}>{t('vehicle_monitoring')}</h1>
          <p style={{ color:'var(--text-medium)', fontSize:'1.1rem', fontWeight:'500' }}>{t('fleet_management_desc')}</p>
        </div>
        <div style={{ display:'flex', gap:'1rem' }}>
          <div style={{ position:'relative', width:'300px' }}>
            <FiSearch style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-medium)' }} />
            <input type="text" className="input-field" style={{ paddingLeft:'2.8rem' }} placeholder={t('search_vehicle')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding:'0.8rem 1.5rem', borderRadius:'14px' }}>
            <FiPlus /> {t('add_vehicle')}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'1.5rem', marginBottom:'3rem' }}>
        {[
          { label: t('total_fleet'), val: stats.total, icon: <FiTruck />, color: 'var(--primary-blue)', bg: '#EFF6FF' },
          { label: t('active_cars'), val: stats.active, icon: <FiCheckCircle />, color: '#10B981', bg: '#ECFDF5' }
        ].map((s, i) => (
          <div key={i} className="card" style={{ display:'flex', alignItems:'center', gap:'1.5rem', padding:'1.5rem', border:'1px solid #F1F5F9' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'16px', backgroundColor:s.bg, color:s.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize:'0.875rem', fontWeight:'700', color:'var(--text-medium)', marginBottom:'0.25rem' }}>{s.label}</p>
              <h4 style={{ fontSize:'1.75rem', fontWeight:'900', color:'var(--text-dark)' }}>{s.val}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(400px, 1fr))', gap:'2rem' }}>
        {vehicles.filter(v => v.model.toLowerCase().includes(searchTerm.toLowerCase()) || v.registration_plate.includes(searchTerm)).map(v => {
          const { remaining, pct } = calcOil(v);
          const insDays = daysUntil(v.insurance_expiry);
          const insExpired = insDays !== null && insDays <= 0;
          const insWarn = insDays !== null && insDays > 0 && insDays <= 2;
          const techDays = daysUntil(v.tech_inspection_expiry);
          const techExpired = techDays !== null && techDays <= 0;
          const techWarn = techDays !== null && techDays > 0 && techDays <= 2;
          const oilDanger = remaining <= 0;
          const oilWarn = remaining > 0 && remaining <= 1000;

          return (
            <div key={v.id} className="card-hover" style={{ backgroundColor:'white', borderRadius:'24px', padding:'2rem', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.05)', border: (insExpired || techExpired || oilDanger) ? '2px solid #FCA5A5' : '1px solid #F1F5F9', position:'relative', cursor:'pointer' }}
              onClick={() => { setSelectedVehicle(v); setShowDetailModal(true); fetchVehicleDetails(v.id); setNewLog(prev => ({ ...prev, start_km: v.mileage })); }}>

              {/* Card Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  <div style={{ width:'52px', height:'52px', borderRadius:'12px', backgroundColor:'#EFF6FF', color:'var(--primary-blue)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <FiTruck size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight:'800', fontSize:'1.125rem' }}>{v.model}</h3>
                    <p style={{ fontSize:'0.8rem', color:'var(--text-medium)', fontWeight:'600' }}>{v.registration_plate}</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <button onClick={(e) => { e.stopPropagation(); setEditingVehicle(v); }} style={{ background:'transparent', border:'none', color:'var(--text-medium)', cursor:'pointer', display:'flex', alignItems:'center' }}><FiEdit size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(v.id); }} style={{ background:'transparent', border:'none', color:'#EF4444', cursor:'pointer', display:'flex', alignItems:'center' }}><FiTrash2 size={16} /></button>
                </div>
              </div>

              {/* Oil Bar */}
              <div style={{ marginBottom:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem', fontSize:'0.8rem', fontWeight:'700' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><FiTool size={13}/> {t('oil_change')}</span>
                  <span style={{ color: oilDanger ? '#EF4444' : oilWarn ? '#F59E0B' : 'var(--text-medium)' }}>
                    {oilDanger ? `${t('oil_exceeded')} ${Math.abs(remaining).toLocaleString()} ${t('oil_remaining')}` : `${remaining.toLocaleString()} ${t('oil_remaining')}`}
                  </span>
                </div>
                <div style={{ width:'100%', height:'8px', backgroundColor:'#F1F5F9', borderRadius:'4px', overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', backgroundColor: pct < 20 ? '#EF4444' : pct < 50 ? '#F59E0B' : '#10B981', transition:'width 1s ease-in-out' }} />
                </div>
              </div>

              {/* Info Row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem', marginBottom:'1.25rem' }}>
                <div style={{ backgroundColor:'#F8FAFC', padding:'0.75rem', borderRadius:'12px', textAlign:'center' }}>
                  <FiActivity size={15} style={{ color:'var(--primary-blue)', marginBottom:'0.2rem' }} />
                  <p style={{ fontSize:'0.65rem', color:'var(--text-medium)', fontWeight:'600', textTransform:'uppercase' }}>{t('mileage')}</p>
                  <p style={{ fontWeight:'800', fontSize:'0.85rem' }}>{formatMileage(v.mileage)}</p>
                </div>
                <div style={{ backgroundColor: insExpired ? '#FEF2F2' : insWarn ? '#FFFBEB' : '#F8FAFC', padding:'0.75rem', borderRadius:'12px', textAlign:'center', border: insExpired ? '1px solid #FECACA' : insWarn ? '1px solid #FDE68A' : 'none' }}>
                  <FiShield size={15} style={{ color: insExpired ? '#EF4444' : insWarn ? '#F59E0B' : '#64748B', marginBottom:'0.2rem' }} />
                  <p style={{ fontSize:'0.65rem', color:'var(--text-medium)', fontWeight:'600', textTransform:'uppercase' }}>{t('insurance')}</p>
                  <p style={{ fontWeight:'800', fontSize:'0.75rem', color: insExpired ? '#EF4444' : 'inherit' }}>
                    {v.insurance_expiry ? (insExpired ? (insDays === 0 ? t('expired') : `${t('expired_since')} ${Math.abs(insDays)} ${t('days')}`) : `${insDays} ${t('days')}`) : 'N/A'}
                  </p>
                </div>
                <div style={{ backgroundColor: techExpired ? '#FEF2F2' : techWarn ? '#FFFBEB' : '#F8FAFC', padding:'0.75rem', borderRadius:'12px', textAlign:'center', border: techExpired ? '1px solid #FECACA' : techWarn ? '1px solid #FDE68A' : 'none' }}>
                  <FiActivity size={15} style={{ color: techExpired ? '#EF4444' : techWarn ? '#F59E0B' : '#64748B', marginBottom:'0.2rem' }} />
                  <p style={{ fontSize:'0.65rem', color:'var(--text-medium)', fontWeight:'600', textTransform:'uppercase' }}>{t('tech_inspection')}</p>
                  <p style={{ fontWeight:'800', fontSize:'0.75rem', color: techExpired ? '#EF4444' : 'inherit' }}>
                    {v.tech_inspection_expiry ? (techExpired ? (techDays === 0 ? t('expired') : `${t('expired_since')} ${Math.abs(techDays)} ${t('days')}`) : `${techDays} ${t('days')}`) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Alerts */}
              {(insExpired || techExpired || oilDanger) && (
                <div style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'10px', padding:'0.6rem 0.9rem', display:'flex', alignItems:'center', gap:'0.5rem', color:'#991B1B', fontSize:'0.78rem', fontWeight:'700', marginBottom:'1rem' }}>
                  <FiAlertTriangle size={14}/>
                  {insExpired ? `${t('alert_ins_expired')} ` : ''}
                  {techExpired ? `${t('alert_tech_expired')} ` : ''}
                  {oilDanger ? t('alert_oil_required') : ''}
                </div>
              )}


            </div>
          );
        })}
      </div>

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div className="card" style={{ width:'420px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:'800' }}>
                {confirmAction.type === 'insurance' ? `🛡️ ${t('confirm_insurance')}` : confirmAction.type === 'tech' ? `📋 ${t('confirm_tech')}` : `🔧 ${t('confirm_oil')}`}
              </h2>
              <button style={{ background:'transparent', border:'none', cursor:'pointer' }} onClick={() => setConfirmAction(null)}><FiX size={20}/></button>
            </div>
            <p style={{ color:'var(--text-medium)', marginBottom:'1.5rem', fontSize:'0.9rem' }}>
              <strong>{confirmAction.vehicle.model}</strong> — {confirmAction.vehicle.registration_plate}
            </p>
            {confirmAction.type === 'insurance' || confirmAction.type === 'tech' ? (
              <form onSubmit={e => { 
                e.preventDefault(); 
                const formData = new FormData(e.target);
                if(confirmAction.type === 'insurance') 
                  handleInsuranceDone(confirmAction.vehicle, formData.get('date'), formData.get('amount'), formData.get('description')); 
                else 
                  handleTechDone(confirmAction.vehicle, formData.get('date'), formData.get('amount'), formData.get('description')); 
              }}>
                <div style={{ marginBottom:'1rem' }}>
                  <label className="label">{confirmAction.type === 'insurance' ? t('new_insurance_date') : t('new_tech_date')}</label>
                  <input required name="date" type="date" className="input-field" defaultValue={confirmAction.type === 'insurance' ? confirmAction.vehicle.insurance_expiry : confirmAction.vehicle.tech_inspection_expiry} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div><label className="label">{t('amount')}</label><input name="amount" type="number" step="0.01" className="input-field" placeholder="0.00" /></div>
                  <div><label className="label">{t('description')}</label><input name="description" type="text" className="input-field" defaultValue={confirmAction.type === 'insurance' ? 'تأمين' : 'فحص فني'} /></div>
                </div>
                <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end' }}>
                  <button type="button" className="btn" onClick={() => setConfirmAction(null)}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-secondary"><FiCheckCircle/> {t('confirm')}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleOilDone(confirmAction.vehicle, formData.get('amount'), formData.get('description'));
              }}>
                <div style={{ backgroundColor:'#F8FAFC', padding:'1rem', borderRadius:'12px', marginBottom:'1.5rem', textAlign:'center' }}>
                  <p style={{ fontSize:'0.85rem', color:'var(--text-medium)' }}>{t('oil_change_msg')}</p>
                  <p style={{ fontSize:'1.5rem', fontWeight:'800', color:'var(--primary-blue)', marginTop:'0.5rem' }}>{formatMileage(confirmAction.vehicle.mileage)}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div><label className="label">{t('amount')}</label><input name="amount" type="number" step="0.01" className="input-field" placeholder="0.00" /></div>
                  <div><label className="label">{t('description')}</label><input name="description" type="text" className="input-field" defaultValue="تغيير زيت" /></div>
                </div>
                <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end' }}>
                  <button type="button" className="btn" onClick={() => setConfirmAction(null)}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-secondary" disabled={loading}><FiCheckCircle/> {t('confirm')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div className="card" style={{ width:'500px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
              <h2 style={{ fontSize:'1.5rem', fontWeight:'800' }}>{t('add_vehicle')}</h2>
              <button style={{ background:'transparent', border:'none', cursor:'pointer' }} onClick={() => setShowModal(false)}><FiX size={20}/></button>
            </div>
            <form onSubmit={handleAddVehicle}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div><label className="label">{t('vehicle_model')}</label><input required type="text" className="input-field" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model:e.target.value})} /></div>
                <div><label className="label">{t('registration')}</label><input required type="text" className="input-field" value={newVehicle.registration_plate} onChange={e => setNewVehicle({...newVehicle, registration_plate:e.target.value})} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div><label className="label">{t('mileage')}</label><input type="number" className="input-field" value={newVehicle.mileage} onChange={e => setNewVehicle({...newVehicle, mileage:parseInt(e.target.value)||0})} /></div>
                <div><label className="label">{t('last_oil_change')}</label><input type="number" className="input-field" value={newVehicle.last_oil_change_km} onChange={e => setNewVehicle({...newVehicle, last_oil_change_km:parseInt(e.target.value)||0})} /></div>
                <div><label className="label">{t('oil_interval')}</label><input type="number" className="input-field" value={newVehicle.oil_interval} onChange={e => setNewVehicle({...newVehicle, oil_interval:parseInt(e.target.value)||10000})} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'2rem' }}>
                <div><label className="label">{t('insurance')}</label><input type="date" className="input-field" value={newVehicle.insurance_expiry} onChange={e => setNewVehicle({...newVehicle, insurance_expiry:e.target.value})} /></div>
                <div><label className="label">{t('tech_inspection')}</label><input type="date" className="input-field" value={newVehicle.tech_inspection_expiry} onChange={e => setNewVehicle({...newVehicle, tech_inspection_expiry:e.target.value})} /></div>
              </div>
              <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-secondary" disabled={loading}>{loading ? '...' : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div className="card" style={{ width:'500px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
              <h2 style={{ fontSize:'1.5rem', fontWeight:'800' }}>{t('edit_vehicle')}</h2>
              <button style={{ background:'transparent', border:'none', cursor:'pointer' }} onClick={() => setEditingVehicle(null)}><FiX size={20}/></button>
            </div>
            <form onSubmit={handleUpdateVehicle}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div><label className="label">{t('vehicle_model')}</label><input required type="text" className="input-field" value={editingVehicle.model} onChange={e => setEditingVehicle({...editingVehicle, model:e.target.value})} /></div>
                <div><label className="label">{t('registration')}</label><input required type="text" className="input-field" value={editingVehicle.registration_plate} onChange={e => setEditingVehicle({...editingVehicle, registration_plate:e.target.value})} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                <div><label className="label">{t('mileage')}</label><input type="number" className="input-field" value={editingVehicle.mileage} onChange={e => setEditingVehicle({...editingVehicle, mileage:parseInt(e.target.value)||0})} /></div>
                <div><label className="label">{t('last_oil_change')}</label><input type="number" className="input-field" value={editingVehicle.last_oil_change_km} onChange={e => setEditingVehicle({...editingVehicle, last_oil_change_km:parseInt(e.target.value)||0})} /></div>
                <div><label className="label">{t('oil_interval')}</label><input type="number" className="input-field" value={editingVehicle.oil_interval} onChange={e => setEditingVehicle({...editingVehicle, oil_interval:parseInt(e.target.value)||10000})} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'2rem' }}>
                <div><label className="label">{t('insurance')}</label><input type="date" className="input-field" value={editingVehicle.insurance_expiry} onChange={e => setEditingVehicle({...editingVehicle, insurance_expiry:e.target.value})} /></div>
                <div><label className="label">{t('tech_inspection')}</label><input type="date" className="input-field" value={editingVehicle.tech_inspection_expiry} onChange={e => setEditingVehicle({...editingVehicle, tech_inspection_expiry:e.target.value})} /></div>
              </div>
              <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditingVehicle(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-secondary" disabled={loading}>{loading ? '...' : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedVehicle && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div className="card" style={{ width:'800px', maxHeight:'90vh', overflowY:'auto', padding:0 }}>
            <div style={{ padding:'2rem', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
                <div style={{ width:'64px', height:'64px', borderRadius:'16px', backgroundColor:'#EFF6FF', color:'var(--primary-blue)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <FiTruck size={32}/>
                </div>
                <div>
                  <h2 style={{ fontSize:'1.5rem', fontWeight:'800' }}>{selectedVehicle.model}</h2>
                  <p style={{ color:'var(--text-medium)', fontWeight:'600' }}>{selectedVehicle.registration_plate}</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button className="btn" style={{ color:'var(--text-medium)' }} onClick={() => { setEditingVehicle(selectedVehicle); setShowDetailModal(false); }}><FiEdit size={16}/> {t('edit')}</button>
                <button className="btn" style={{ color:'#EF4444' }} onClick={() => { handleDeleteVehicle(selectedVehicle.id); setShowDetailModal(false); }}><FiTrash2 size={16}/> {t('delete')}</button>
                <button className="btn" onClick={() => setShowDetailModal(false)}><FiX size={18}/> {t('cancel')}</button>
              </div>
            </div>

            <div style={{ display:'flex', borderBottom:'1px solid #F1F5F9' }}>
              {['status','maintenance','expenses','docs'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex:1, padding:'1rem', border:'none', background: activeTab===tab ? '#EFF6FF' : 'transparent', color: activeTab===tab ? 'var(--primary-blue)' : 'var(--text-medium)', fontWeight:'700', cursor:'pointer' }}>
                  {tab==='status'?t('daily_km'):tab==='maintenance'?t('oil_change'):tab==='expenses'?t('expenses'):'Documents'}
                </button>
              ))}
            </div>

            <div style={{ padding:'2rem' }}>
              {activeTab==='status' && (
                <div>
                  <form onSubmit={handleAddLog} style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr auto', gap:'1.5rem', alignItems:'flex-end', marginBottom:'2.5rem', padding:'2rem', backgroundColor:'#F8FAFC', borderRadius:'24px', border:'1px solid #E2E8F0' }}>
                    <div><label className="label">{t('date')}</label><input type="date" className="input-field" value={newLog.date} onChange={e => setNewLog({...newLog,date:e.target.value})}/></div>
                    <div><label className="label">{t('morning_km')}</label><input required type="number" className="input-field" value={newLog.start_km} onChange={e => setNewLog({...newLog,start_km:e.target.value})}/></div>
                    <div><label className="label">{t('evening_km')}</label><input required type="number" className="input-field" placeholder={t('end_km_placeholder')} value={newLog.end_km} onChange={e => setNewLog({...newLog,end_km:e.target.value})}/></div>
                    <button type="submit" className="btn btn-primary" style={{ height:'48px', padding:'0 1.5rem', borderRadius:'14px' }}>{t('save_log')}</button>
                  </form>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead><tr><th>{t('date')}</th><th>{t('morning_km')}</th><th>{t('evening_km')}</th><th>Total (KM)</th><th>{t('actions')}</th></tr></thead>
                      <tbody>{logs.map(l => (<tr key={l.id}><td>{new Date(l.date).toLocaleDateString()}</td><td>{l.start_km}</td><td>{l.end_km}</td><td style={{ fontWeight:'800', color:'var(--primary-blue)' }}>{l.end_km - l.start_km} km</td><td><button className="btn" onClick={() => setEditingLog(l)} style={{ padding: '0.4rem', color: 'var(--primary-blue)', background: 'transparent' }}><FiEdit size={16} /></button><button className="btn" onClick={() => handleDeleteLog(l.id)} style={{ padding: '0.4rem', color: '#EF4444', background: 'transparent' }}><FiTrash2 size={16} /></button></td></tr>))}</tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab==='maintenance' && (
                <div style={{ padding:'1rem' }}>
                  <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap', marginBottom:'2.5rem', backgroundColor:'#F8FAFC', padding:'1.5rem', borderRadius:'20px', border:'1px solid #E2E8F0' }}>
                    <button className="btn" style={{ backgroundColor:'#EFF6FF', color:'var(--primary-blue)', flex:1, minWidth:'150px' }} onClick={() => { setConfirmAction({ type:'insurance', vehicle: selectedVehicle }); setShowDetailModal(false); }}>
                      <FiShield/> {t('confirm_insurance')}
                    </button>
                    <button className="btn" style={{ backgroundColor:'#E0F2FE', color:'#0369A1', flex:1, minWidth:'150px' }} onClick={() => { setConfirmAction({ type:'tech', vehicle: selectedVehicle }); setShowDetailModal(false); }}>
                      <FiActivity/> {t('confirm_tech')}
                    </button>
                    <button className="btn btn-primary" style={{ flex:1, minWidth:'150px' }} onClick={() => { setConfirmAction({ type:'oil', vehicle: selectedVehicle }); setShowDetailModal(false); }}>
                      <FiCheckCircle/> {t('oil_change_completed')}
                    </button>
                  </div>

                  <div style={{ textAlign:'center', marginBottom:'2.5rem', padding:'1.5rem', backgroundColor:'white', borderRadius:'20px', border:'1px solid #F1F5F9' }}>
                    <h3 style={{ fontSize:'1.1rem', marginBottom:'1rem', color:'var(--text-dark)' }}>{t('oil_status') || 'حالة الزيت'}</h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1rem' }}>
                      <div style={{ padding:'1rem', backgroundColor:'#F8FAFC', borderRadius:'12px' }}>
                        <p style={{ fontSize:'0.8rem', color:'var(--text-medium)' }}>{t('last_oil_change')}</p>
                        <p style={{ fontSize:'1.1rem', fontWeight:'800' }}>{selectedVehicle.last_oil_change_km} km</p>
                      </div>
                      <div style={{ padding:'1rem', backgroundColor:'#F8FAFC', borderRadius:'12px' }}>
                        <p style={{ fontSize:'0.8rem', color:'var(--text-medium)' }}>{t('current_km') || 'العداد الحالي'}</p>
                        <p style={{ fontSize:'1.1rem', fontWeight:'800' }}>{selectedVehicle.mileage} km</p>
                      </div>
                      <div style={{ padding:'1rem', backgroundColor: calcOil(selectedVehicle).remaining < 1000 ? '#FEE2E2' : '#F8FAFC', borderRadius:'12px', color: calcOil(selectedVehicle).remaining < 1000 ? '#EF4444' : 'inherit' }}>
                        <p style={{ fontSize:'0.8rem', color: calcOil(selectedVehicle).remaining < 1000 ? '#EF4444' : 'var(--text-medium)' }}>{t('remaining')}</p>
                        <p style={{ fontSize:'1.1rem', fontWeight:'800' }}>{calcOil(selectedVehicle).remaining} km</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop:'2rem' }}>
                    <h3 style={{ fontSize:'1rem', fontWeight:'700', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <FiClock size={18}/> {t('confirmation_history') || 'سجل التأكيدات'}
                    </h3>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead><tr><th>{t('date')}</th><th>{t('type') || 'النوع'}</th><th>{t('description')}</th><th>{t('amount')}</th></tr></thead>
                        <tbody>
                          {expenses.filter(ex => ['Repair', 'Insurance', 'Insurance'].includes(ex.category) || ex.description.includes('زيت') || ex.description.includes('تأمين') || ex.description.includes('فحص')).slice(0, 5).map(ex => (
                            <tr key={ex.id}>
                              <td>{new Date(ex.date).toLocaleDateString()} {new Date(ex.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                              <td>{ex.category === 'Insurance' ? t('insurance') : t('maintenance')}</td>
                              <td style={{ fontWeight:'600' }}>{ex.description}</td>
                              <td>{ex.amount} DT</td>
                            </tr>
                          ))}
                          {expenses.filter(ex => ex.description.includes('زيت') || ex.description.includes('تأمين') || ex.description.includes('فحص')).length === 0 && (
                            <tr><td colSpan="4" style={{ textAlign:'center', color:'var(--text-medium)', padding:'2rem' }}>{t('no_history') || 'لا يوجد سجل تأكيدات بعد'}</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {activeTab==='expenses' && (
                <div>
                  <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.target); try { await api.post(`/api/vehicles/${selectedVehicle.id}/expenses`, { amount:fd.get('amount'), category:fd.get('category'), date:new Date().toISOString().split('T')[0], description:fd.get('description') }); fetchVehicleDetails(selectedVehicle.id); e.target.reset(); } catch { alert('Error'); }}} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:'1rem', alignItems:'flex-end', marginBottom:'2rem', padding:'1.5rem', backgroundColor:'#F8FAFC', borderRadius:'16px' }}>
                    <div><label className="label">{t('amount')}</label><input required name="amount" type="number" className="input-field"/></div>
                    <div><label className="label">{t('category')}</label><select name="category" className="input-field"><option value="Fuel">Fuel</option><option value="Repair">Repair</option><option value="Insurance">Insurance</option></select></div>
                    <div><label className="label">{t('description')}</label><input name="description" type="text" className="input-field"/></div>
                    <button type="submit" className="btn btn-primary" style={{ height:'42px' }}><FiPlus/></button>
                  </form>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead><tr><th>{t('date')}</th><th>{t('category')}</th><th>{t('description')}</th><th>{t('amount')}</th><th>{t('actions')}</th></tr></thead>
                      <tbody>{expenses.map(ex => (
                        <tr key={ex.id}>
                          <td>{new Date(ex.date).toLocaleDateString()}</td>
                          <td>{ex.category}</td>
                          <td>{ex.description}</td>
                          <td style={{ fontWeight:'800' }}>{ex.amount} DT</td>
                          <td>
                            <div style={{ display:'flex', gap:'0.5rem' }}>
                              <button className="btn btn-secondary" style={{ padding:'0.4rem' }} onClick={() => {
                                // Logic to edit vehicle expense (similar to general expenses)
                                const amt = window.prompt("New Amount:", ex.amount);
                                if (amt) {
                                  api.put(`/api/finances/expenses/${ex.id}`, { ...ex, amount: amt }).then(() => fetchVehicleDetails(selectedVehicle.id));
                                }
                              }}><FiEdit size={14}/></button>
                              <button className="btn" style={{ padding:'0.4rem', backgroundColor:'#FEE2E2', color:'#EF4444' }} onClick={() => handleDeleteExpense(ex.id, 'Fleet')}><FiTrash2 size={14}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab==='docs' && (
                <div style={{ maxWidth:'400px', margin:'0 auto' }}>
                  <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.target); try { await api.put(`/api/vehicles/${selectedVehicle.id}`, { ...selectedVehicle, insurance_expiry:fd.get('insurance_expiry'), tech_inspection_expiry:fd.get('tech_inspection_expiry') }); fetchVehicles(); refreshNotifications(); alert('Documents updated'); } catch { alert('Error'); }}}>
                    <div style={{ marginBottom:'1.5rem' }}><label className="label">{t('insurance')}</label><input name="insurance_expiry" type="date" className="input-field" defaultValue={selectedVehicle.insurance_expiry}/></div>
                    <div style={{ marginBottom:'2rem' }}><label className="label">{t('tech_inspection')}</label><input name="tech_inspection_expiry" type="date" className="input-field" defaultValue={selectedVehicle.tech_inspection_expiry}/></div>
                    <button type="submit" className="btn btn-secondary" style={{ width:'100%' }}><FiCheckCircle/> {t('save')}</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Log Modal */}
      {editingLog && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
          <div className="card" style={{ width:'400px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:'800' }}>{t('edit_log')}</h2>
              <button style={{ background:'transparent', border:'none', cursor:'pointer' }} onClick={() => setEditingLog(null)}><FiX size={20}/></button>
            </div>
            <form onSubmit={handleEditLog} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div><label className="label">{t('date')}</label><input required type="date" className="input-field" value={editingLog.date.split('T')[0]} onChange={e => setEditingLog({...editingLog, date: e.target.value})} /></div>
              <div><label className="label">{t('morning_counter')}</label><input required type="number" className="input-field" value={editingLog.start_km} onChange={e => setEditingLog({...editingLog, start_km: e.target.value})} /></div>
              <div><label className="label">{t('evening_counter')}</label><input required type="number" className="input-field" value={editingLog.end_km} onChange={e => setEditingLog({...editingLog, end_km: e.target.value})} /></div>
              <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end', marginTop:'1rem' }}>
                <button type="button" className="btn" onClick={() => setEditingLog(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-secondary" disabled={loading}>{loading ? '...' : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
