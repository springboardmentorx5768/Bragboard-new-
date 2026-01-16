import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

// function Dashboard() { ... } removed
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import DepartmentFeed from './pages/DepartmentFeed';
import Notifications from './pages/Notifications';
import Departments from './pages/Departments';
import AdminDashboard from './pages/AdminDashboard';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/department-feed" element={<DepartmentFeed />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>

          <Route path="/admin-dashboard" element={<AdminDashboard />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;


