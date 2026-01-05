import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaComment, FaTag, FaCheck, FaTimesCircle, FaBell, FaTrash } from 'react-icons/fa';

import API_BASE from "../config";

const NotificationSection = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            if (!token) return;

            const res = await fetch(`${API_BASE}/users/me/notifications?limit=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                const unread = data.filter(n => n.is_read === "false").length;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            const token = sessionStorage.getItem('access_token');
            await fetch(`${API_BASE}/users/me/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_read: "true" } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const deleteNotification = async (id, e) => {
        if (e) e.stopPropagation();

        if (!window.confirm("Are you sure you want to delete this notification?")) return;

        try {
            const token = sessionStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/users/me/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setNotifications(prev => {
                    const notification = prev.find(n => n.id === id);
                    if (notification && notification.is_read === "false") {
                        setUnreadCount(c => Math.max(0, c - 1));
                    }
                    return prev.filter(n => n.id !== id);
                });
            }
        } catch (err) {
            console.error("Failed to delete notification", err);
        }
    };

    const getIcon = (type) => {
        if (type.startsWith("reaction")) return <FaHeart className="text-red-500" />;
        if (type === "comment") return <FaComment className="text-blue-500" />;
        if (type === "tag") return <FaTag className="text-purple-500" />;
        return <FaBell className="text-gray-500" />;
    };

    const getTypeLabel = (type) => {
        if (type.startsWith("reaction")) return "Reaction";
        if (type === "comment") return "Comment";
        if (type === "tag") return "Tag";
        return "Notification";
    };

    if (notifications.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center text-gray-500">
                <p>No new notifications.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FaBell className="text-blue-600" />
                    Notifications
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadCount} New
                        </span>
                    )}
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Message</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <tr
                                key={notification.id}
                                className={`hover:bg-gray-50 transition-colors ${notification.is_read === "false" ? "bg-blue-50/50" : ""}`}
                            >
                                <td className="px-4 py-3 flex items-center gap-2 font-medium">
                                    {getIcon(notification.type)}
                                    {getTypeLabel(notification.type)}
                                </td>
                                <td className="px-4 py-3">
                                    {notification.message}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                                    {new Date(notification.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {notification.is_read === "false" ? (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors tooltip"
                                            title="Mark as Read"
                                        >
                                            <FaCheck />
                                        </button>
                                    ) : (
                                        <span className="text-gray-300">
                                            <FaCheck />
                                            <FaCheck />
                                        </span>
                                    )}
                                    <button
                                        onClick={(e) => deleteNotification(notification.id, e)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors ml-2"
                                        title="Delete Notification"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default NotificationSection;
