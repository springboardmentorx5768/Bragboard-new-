import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaUserCircle, FaPencilAlt, FaSignOutAlt, FaBell, FaChartLine, FaUser } from "react-icons/fa";
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ isFixed = true }) {
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:8000/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
        }
      } catch (error) {
        console.error("Failed to fetch user for navbar", error);
      }
    };
    if (token) fetchUser();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:8000/notifications/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      // Poll for notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:8000/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updated = notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n);
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Error marking read", err);
    }
  };

  return (
    <header className={`${isFixed ? 'fixed' : 'relative'} top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200`}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* LEFT: Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/success')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-900 to-green-400 flex items-center justify-center text-white font-bold">
            🏠︎
          </div>
          <div>
            <div className="text-sm font-semibold text-green-800">BragBoard</div>
            <div className="text-xs text-gray-500">Employee Recognition</div>
          </div>
        </div>

        {/* RIGHT: Nav buttons */}
        <div className="flex items-center gap-6">

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center gap-2 text-green-900 hover:text-purple-600 transition-colors"
            >
              <div className="relative">
                <FaBell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span>Notifications</span>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                >
                  <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{unreadCount} new</span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm italic">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                          onClick={() => {
                            markAsRead(notif.id);
                            // Navigate if specific type, e.g. navigate(`/shoutout/${notif.reference_id}`)
                          }}
                        >
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                          <div>
                            <p className="text-sm text-gray-800 leading-snug">{notif.message}</p>
                            <span className="text-xs text-gray-400 mt-1 block">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-green-900 hover:text-pink-600 font-medium transition-colors">
            <FaChartLine size={20} />
            <span>Activity</span>
          </button>

          <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-green-900 hover:text-blue-600 font-medium transition-colors">
            {currentUser && currentUser.profile_image_url ? (
              <img src={`http://localhost:8000${currentUser.profile_image_url}`} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
            ) : (
              <FaUserCircle size={28} />
            )}
            <span>Profile</span>
          </button>

          <button className="flex items-center gap-2 text-green-900 hover:text-yellow-600 font-medium transition-colors">
            <FaPencilAlt size={18} />
            <span>Edit</span>
          </button>

          <button onClick={handleLogout} className="flex items-center gap-2 text-green-900 hover:text-red-600 font-medium transition-colors ml-2">
            <FaSignOutAlt size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
