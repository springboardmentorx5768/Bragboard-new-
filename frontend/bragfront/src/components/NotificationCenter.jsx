import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheckDouble, FaCircle } from 'react-icons/fa';

const NotificationCenter = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const token = localStorage.getItem('token');

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:8000/api/notifications/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => n.is_read === 0).length);
            }
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            const res = await fetch(`http://localhost:8000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error("Error marking as read", error);
        }
    };

    const markAllRead = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/notifications/read-all', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error("Error marking all read", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-12 h-12 flex items-center justify-center lumina-glass text-slate-400 hover:text-brand-primary transition-all rounded-xl border border-white/5 active:scale-95 shadow-2xl"
            >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-lg bg-brand-primary text-[10px] font-black text-white dark:text-brand-dark shadow-[0_0_10px_rgba(34,211,238,0.6)] border border-white dark:border-brand-dark">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-96 lumina-card overflow-hidden z-50 animate-fade-in border border-black/5 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.01] dark:bg-white/[0.02]">
                        <h3 className="font-black text-slate-900 dark:text-white tracking-tight">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-primary hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                            >
                                <FaCheckDouble /> Mark All Read
                            </button>
                        )}
                    </div>
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-white/[0.03]">
                        {notifications.length === 0 ? (
                            <div className="p-16 text-center space-y-4">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/5">
                                    <FaBell className="text-2xl text-slate-700" />
                                </div>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-widest italic">No notifications yet.</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => {
                                        markAsRead(notif.id);
                                        setIsOpen(false);
                                        if (notif.source_id) {
                                            navigate(`/dashboard?shoutoutId=${notif.source_id}`);
                                        } else {
                                            navigate('/dashboard');
                                        }
                                    }}
                                    className={`p-6 hover:bg-white/[0.02] transition-all cursor-pointer flex gap-5 group relative ${notif.is_read === 0 ? 'bg-brand-primary/[0.03]' : ''}`}
                                >
                                    <div className="mt-1 flex-shrink-0">
                                        {notif.is_read === 0 ? (
                                            <div className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(34,211,238,1)] animate-pulse" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-slate-800" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-relaxed ${notif.is_read === 0 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 font-medium'}`}>
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-[9px] font-black text-brand-primary/40 uppercase tracking-widest">
                                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="absolute right-0 top-0 w-1 h-full bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 bg-black/[0.01] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 text-center">
                        <button onClick={() => setIsOpen(false)} className="text-[9px] font-black text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 uppercase tracking-[0.3em] transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
