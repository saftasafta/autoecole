import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { FiLock, FiMail } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';

const Login = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/api/auth/login', {
        email, password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--bg-light)',
      backgroundImage: 'radial-gradient(var(--primary-blue) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      backgroundPosition: '-19px -19px',
      opacity: 0.95
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '64px', height: '64px', backgroundColor: 'var(--primary-blue)', 
            borderRadius: '16px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 1rem',
            boxShadow: '0 10px 15px -3px rgba(30, 58, 138, 0.3)'
          }}>
            <span style={{ color: 'var(--accent-yellow)', fontWeight: 'bold', fontSize: '2rem' }}>A</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{t('welcome_back')}</h1>
          <p style={{ color: 'var(--text-medium)', marginTop: '0.5rem', fontSize: '0.875rem' }}>{t('login_desc')}</p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#FDE8E8', color: '#9B1C1C', 
            padding: '0.75rem', borderRadius: '8px', 
            fontSize: '0.875rem', marginBottom: '1.5rem',
            border: '1px solid #FBD5D5'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>{t('email')}</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-medium)' }} />
              <input 
                type="email" 
                className="input-field" 
                placeholder="admin@autoecole.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>{t('password')}</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-medium)' }} />
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? t('loading') : t('login')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

