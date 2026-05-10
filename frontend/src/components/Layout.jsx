import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiUser } from 'react-icons/fi';

const Layout = () => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Navbar */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--bg-white)',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-dark)' }}>Auto-Ecole</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <FiUser size={18} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Admin</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
