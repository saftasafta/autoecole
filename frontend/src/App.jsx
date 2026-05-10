import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './LanguageContext';
import { NotificationsProvider } from './NotificationsContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Sessions from './pages/Sessions';
import Payments from './pages/Payments';
import Tariffs from './pages/Tariffs';
import Exams from './pages/Exams';
import Fleet from './pages/Fleet';
import Instructors from './pages/Instructors';
import Finances from './pages/Finances';
import HomeArt from './pages/HomeArt';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <LanguageProvider>
      <NotificationsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes wrapped in Layout */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="payments" element={<Payments />} />
              <Route path="tariffs" element={<Tariffs />} />
              <Route path="exams" element={<Exams />} />
              <Route path="fleet" element={<Fleet />} />
              <Route path="instructors" element={<Instructors />} />
              <Route path="finances" element={<Finances />} />
              <Route path="home-art" element={<HomeArt />} />
            </Route>
          </Routes>
        </Router>
      </NotificationsProvider>
    </LanguageProvider>
  );
}

export default App;
