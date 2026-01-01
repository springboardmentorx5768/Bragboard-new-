import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Login from './components/Login';

import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import './App.css';

// function Dashboard() { ... } removed
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import DepartmentFeed from './pages/DepartmentFeed';

function App() {
  return (

    <ToastProvider>
      <Router>
        <div className="App theme-deep-nebula min-h-screen text-slate-100">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes wrapped in Layout */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/department-feed" element={<DepartmentFeed />} />
              {/* Future routes like /department can be added here */}
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;


