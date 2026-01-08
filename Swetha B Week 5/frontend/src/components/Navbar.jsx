import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaUserCircle, FaPencilAlt, FaSignOutAlt, FaBell } from "react-icons/fa";
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimeAgo, formatRealTime } from '../utils/dateUtils';

export default function Navbar() {
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentRealTime, setCurrentRealTime] = useState(new Date());

  useEffect(() => {
    let clockInterval;
    if (showNotifications) {
      clockInterval = setInterval(() => {
        setCurrentRealTime(new Date());
      }, 1000);
    }
    return () => clearInterval(clockInterval);
  }, [showNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchNotifications = async () => {
    if (!token) return;

    // Pre-emptive check: Don't fetch if token is expired or close to expiring
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      if (Date.now() >= expiryTime - 5000) {
        console.log("Token expired during poll. Logging out.");
        logout();
        navigate('/');
        return;
      }
    } catch (e) {
      console.error("Error decoding token in Navbar", e);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/notifications/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        navigate('/');
        return;
      }
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
      // Poll for notifications every 10 seconds
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        navigate('/');
        return;
      }
      const updated = notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n);
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Error marking read", err);
    }
  };

  return (
    <header className="relative fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200">
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
              className="flex items-center gap-2 text-green-900 hover:text-yellow-600 transition-colors"
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
                  className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                >
                  <div className="p-3 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span>Notifications</span>
                      <span className="text-[10px] text-gray-400 font-normal">Real Time: {formatRealTime(currentRealTime, true)}</span>
                    </div>
                    <button onClick={() => fetchNotifications()} className="text-xs text-blue-500 hover:text-blue-700">Refresh</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`p-4 border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 text-lg">
                              {notif.type === 'reaction' ? '❤️' : '💬'}
                            </div>
                            <div>
                              <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatRealTime(notif.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-green-900 hover:text-blue-900 transition-colors"
          >
            <FaUserCircle size={24} /> Profile
          </button>

          <button
            onClick={() => navigate("/profile/edit")}
            className="flex items-center gap-2 text-green-900 hover:text-yellow-700 transition-colors"
          >
            <FaPencilAlt size={21} /> Edit
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-green-900 hover:text-red-700 transition-colors"
          >
            <FaSignOutAlt size={20} /> Logout
          </button>
        </div>

        {/* Mobile nav icon */}
        <button
          className="md:hidden flex items-center px-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
          onClick={() => alert("Mobile menu (not implemented)")}
        >
          <FaBars />
        </button>

      </div>
    </header>
  );
}
