
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LoginRegister from './Components/LoginRegister/LoginRegister';
import SuccessPage from './Components/SuccessPage';
import Profile from './Components/Profile';
import EditProfile from './Components/EditProfile';
import Navbar from './Components/Navbar';
import AdminDashboard from './Components/AdminDashboard';
import AdminReports from "./Components/AdminReports"; // Added this import
import AboutPage from './Components/AboutPage';
import ProjectStatusPage from './Components/ProjectStatusPage';
import './App.css'

function Layout({ children }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/success' || location.pathname.startsWith('/profile') || location.pathname.startsWith('/admin') || location.pathname === '/about' || location.pathname === '/status';

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
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/status" element={<ProjectStatusPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App


