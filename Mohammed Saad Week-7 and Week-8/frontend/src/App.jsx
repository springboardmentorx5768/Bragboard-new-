import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginRegister from './Components/LoginRegister/LoginRegister';
import SuccessPage from './Components/SuccessPage';
import Profile from './Components/Profile';
import EditProfile from './Components/EditProfile';
import Shoutout from './Components/Shoutout';
import FeedPage from './Components/FeedPage';
// ✅ ENSURE THIS PATH MATCHES YOUR SIDEBAR
import AdminDashboard from './Components/AdminDashboard'; 
import Navbar from './Components/Navbar';
import './App.css';

function App() {
  const userRole = "ADMIN"; 

  return (
    <Router>
      <Navbar /> {/* Ensure Navbar is outside Routes if it should always show */}
      <Routes>
        <Route path="/" element={<LoginRegister />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/shoutout" element={<Shoutout />} />
        <Route path="/feed" element={<FeedPage />} /> 

        {/* 🎯 THIS IS THE CRITICAL LINE */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/feed" />} />
      </Routes>
    </Router>
  );
}

export default App;