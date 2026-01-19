import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserCircle, FaSignOutAlt, FaCheckCircle, FaArrowRight, FaInfoCircle, FaLock } from 'react-icons/fa';
import AnimatedBackground from './AnimatedBackground';
import ShoutoutForm from './ShoutoutForm';
import ShoutoutFeed from './ShoutoutFeed';
import NotificationSection from './NotificationSection';
import { FaTasks } from 'react-icons/fa';

import API_BASE from "../config";

const SuccessPage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [refreshFeed, setRefreshFeed] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Init null for loading state

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('access_token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUserName(data.name);
          setUserRole(data.role);
          setIsAuthenticated(true);
        } else {
          // Token might be invalid or expired
          setIsAuthenticated(false);
          sessionStorage.removeItem('access_token');
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
        setIsAuthenticated(false);
        sessionStorage.removeItem('access_token');
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.clear(); // Clear all localized data if needed, or just specific keys
    sessionStorage.removeItem('access_token');
    navigate('/');
  };



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-gray-50 px-4">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center relative z-50"
        >
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaLock size={30} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-8 max-w-sm mx-auto">
            Login first or create account to use the platform.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2"
            >
              Go to Login
              <FaArrowRight />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-gray-50">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Navbar (Minimalist & Transparent) */}
      <nav className="absolute top-0 w-full z-20 p-6 flex justify-between items-center bg-transparent">
        <motion.div
          animate={{ x: [-20, 0], opacity: [0, 1] }}
          className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer"
          onClick={() => navigate('/success')}
        >
          BragBoard
        </motion.div>

        <div className="flex items-center gap-6">
          {/* Project Status Link */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/status')}
            className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors font-medium text-sm sm:text-base"
          >
            <FaTasks size={20} />
            <span className="hidden sm:inline">Status</span>
          </motion.button>

          {/* About Link */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/about')}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm sm:text-base"
          >
            <FaInfoCircle size={20} />
            <span className="hidden sm:inline">About</span>
          </motion.button>

          {/* Admin Link */}
          {userRole === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors font-bold text-sm sm:text-base mr-2"
            >
              <FaCheckCircle size={20} /> {/* Reusing icon or update import */}
              <span className="hidden sm:inline">Admin</span>
            </motion.button>
          )}



          {/* User Name */}
          {userName && (
            <span className="text-gray-700 font-semibold hidden sm:inline">
              {userName}
            </span>
          )}

          {/* Profile Link */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm sm:text-base"
          >
            <FaUserCircle size={20} />
            <span className="hidden sm:inline">Profile</span>
          </motion.button>

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all font-medium text-sm sm:text-base"
          >
            <FaSignOutAlt size={18} />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </nav>

      {/* Content Container (Replaces Welcome Card) */}
      <motion.div
        animate={{ y: [20, 0], opacity: [0, 1] }}
        transition={{ duration: 0.5, ease: "outBack" }}
        className="relative z-10 w-full max-w-7xl mx-auto h-[85vh] pt-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

          {/* LEFT COLUMN: Header + Form */}
          <div className="lg:col-span-5 flex flex-col space-y-6 h-full overflow-y-auto custom-scrollbar pb-10">

            <div className="text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Welcome to the Board!
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Recognize your peers and celebrate wins.
              </p>
            </div>

            {/* Shoutout Form */}
            <div className="w-full">
              <ShoutoutForm onShoutoutPosted={() => setRefreshFeed(prev => prev + 1)} />
            </div>

            {/* Notifications Section - Moved below Shoutout Form */}
            <div className="lg:col-span-5 w-full mt-6">
              <NotificationSection />
            </div>
          </div>

          {/* RIGHT COLUMN: Feed */}
          <div className="lg:col-span-7 h-full overflow-y-auto custom-scrollbar pb-20 pr-2">
            <h3 className="text-xl font-bold text-gray-800 mb-4 sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10 py-2">
              Recent Shoutouts
            </h3>
            <ShoutoutFeed refreshTrigger={refreshFeed} />
          </div>

        </div>
      </motion.div>

    </div>
  );
};

export default SuccessPage;
