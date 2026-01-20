import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LoginRegister from './components/LoginRegister/LoginRegister';
import SuccessPage from './components/SuccessPage';
import Profile from './components/Profile';
import EditProfile from './components/EditProfile';
import Navbar from './components/Navbar';
import ShoutOutFeed from './components/ShoutOutFeed';
import Dashboard from './components/Dashboard';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import './App.css'

function Layout({ children }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/success';
  const { token } = useAuth();

  // Screen Time Tracking
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      // Log 60 seconds of screen time
      fetch('http://localhost:8000/activity/screen-time?duration=60', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(err => console.error("Error logging screen time", err));
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [token]);

  return (
    <>
      {!isAuthPage && <Navbar />}
      <main className={!isAuthPage ? "pt-24 px-4" : ""}>
        {children}
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LoginRegister />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/feed" element={<ShoutOutFeed />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
