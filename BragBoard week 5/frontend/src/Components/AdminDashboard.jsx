import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUsers, FaBullhorn, FaShieldAlt, FaHome, FaSignOutAlt, FaTasks, FaCog, FaArrowLeft, FaDownload } from 'react-icons/fa';
import InteractiveBackground from './InteractiveBackground';
import './ProfilePage.css'; // Reusing the profile page styles for consistency

import API_BASE from "../config";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [stats, setStats] = useState({ total_users: 0, total_shoutouts: 0 });

    const [allowComments, setAllowComments] = useState(true);
    const [allowReactions, setAllowReactions] = useState(true);

    const [users, setUsers] = useState([]);
    const [shoutouts, setShoutouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [topContributors, setTopContributors] = useState([]);
    const [mostTagged, setMostTagged] = useState([]);
    const [expandedShoutouts, setExpandedShoutouts] = useState(new Set());

    // Logout handler similar to Profile.jsx
    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        navigate('/');
    };

    useEffect(() => {
        const fetchAdminData = async () => {
            const token = sessionStorage.getItem('access_token');
            if (!token) {
                navigate('/');
                return;
            }

            try {
                // 1. Check Role
                const userRes = await fetch(`${API_BASE}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    if (userData.role !== 'admin') {
                        navigate('/success');
                        return;
                    }
                } else {
                    navigate('/');
                    return;
                }

                // 2. Fetch Stats
                const statsRes = await fetch(`${API_BASE}/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (statsRes.ok) setStats(await statsRes.json());

                // 3. Fetch Settings
                const settingsRes = await fetch(`${API_BASE}/admin/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();

                    if (settingsData.allow_comments !== undefined) {
                        setAllowComments(settingsData.allow_comments === 'true');
                    }
                    if (settingsData.allow_reactions !== undefined) {
                        setAllowReactions(settingsData.allow_reactions === 'true');
                    }
                }

                // 4. Fetch Recent Shoutouts
                const shoutoutsRes = await fetch(`${API_BASE}/shoutouts?limit=50`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (shoutoutsRes.ok) {
                    setShoutouts(await shoutoutsRes.json());
                }

                // 5. Fetch All Users
                const usersRes = await fetch(`${API_BASE}/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (usersRes.ok) {
                    setUsers(await usersRes.json());
                }

                // 6. Fetch Top Contributors
                const topContributorsRes = await fetch(`${API_BASE}/admin/stats/top-contributors`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (topContributorsRes.ok) {
                    setTopContributors(await topContributorsRes.json());
                }

                // 7. Fetch Most Tagged
                const mostTaggedRes = await fetch(`${API_BASE}/admin/stats/most-tagged`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (mostTaggedRes.ok) {
                    setMostTagged(await mostTaggedRes.json());
                }

            } catch (err) {
                console.error("Admin fetch error", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [navigate]);

    const handleDeleteShoutout = async (id) => {
        if (!window.confirm("Are you sure you want to delete this shoutout?")) return;

        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/admin/shoutouts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setShoutouts(prev => prev.filter(s => s.id !== id));
                setStats(prev => ({ ...prev, total_shoutouts: prev.total_shoutouts - 1 }));
            } else {
                alert("Failed to delete shoutout");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteComment = async (commentId, shoutoutId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;

        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/admin/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setShoutouts(prev => prev.map(s => {
                    if (s.id === shoutoutId) {
                        return {
                            ...s,
                            comments: s.comments.filter(c => c.id !== commentId)
                        };
                    }
                    return s;
                }));
            } else {
                alert("Failed to delete comment");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleComments = (shoutoutId) => {
        setExpandedShoutouts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(shoutoutId)) {
                newSet.delete(shoutoutId);
            } else {
                newSet.add(shoutoutId);
            }
            return newSet;
        });
    };

    const handleRoleUpdate = async (userId, newRole) => {
        if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            } else {
                alert("Failed to update role");
            }
        } catch (err) {
            console.error("Role update error", err);
        }
    };

    const handleExportUsers = async () => {
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/admin/reports/export/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'users_report.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Failed to export users");
            }
        } catch (err) {
            console.error("Export users error", err);
        }
    };

    const handleExportShoutouts = async () => {
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/admin/reports/export/shoutouts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'shoutouts_report.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Failed to export shoutouts");
            }
        } catch (err) {
            console.error("Export shoutouts error", err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? They will no longer be able to login, but their posts will be preserved.")) return;

        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_deleted: 'true' } : u));
            } else {
                alert("Failed to delete user");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSetting = async (key, currentValue, setter) => {
        const token = sessionStorage.getItem('access_token');
        const newValue = !currentValue;

        try {
            const res = await fetch(`${API_BASE}/admin/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key, value: newValue ? 'true' : 'false' })
            });

            if (res.ok) {
                setter(newValue);
            }
        } catch (err) {
            console.error(`Failed to toggle ${key}`, err);
        }
    };

    if (error) return (
        <div className="profile-page-container">
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl p-8 rounded-2xl text-center">
                <p className="text-red-500 text-lg mb-4">Error: {error}</p>
                <button
                    onClick={handleLogout}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Back to Login
                </button>
            </div>
        </div>
    );

    if (loading) return <div className="profile-page-container"><div className="text-white font-bold text-xl">Loading Dashboard...</div></div>;

    return (
        <div className="profile-page-container flex-col justify-start pt-20 overflow-y-auto">
            <InteractiveBackground />

            {/* Custom Navbar matching Profile.jsx */}
            <nav className="absolute top-0 w-full z-20 p-6 flex justify-between items-center bg-transparent">
                <div></div>

                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/success')} className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors font-medium drop-shadow-sm">
                        <FaHome size={20} /> <span className="hidden sm:inline">Home</span>
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-white hover:text-red-200 transition-colors font-medium drop-shadow-sm">
                        <FaSignOutAlt size={20} /> <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </nav>

            <div
                className="w-full max-w-6xl relative z-10 px-4 pb-12"
            >
                {/* Header Section */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-6 mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <FaShieldAlt className="text-purple-600" />
                            Dashboard Overview
                        </h1>
                        <p className="text-gray-600 mt-1">Manage users, content, and system settings.</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/reports')}
                        className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl shadow-lg hover:shadow-red-500/30 transition transform hover:scale-105"
                    >
                        View Reports
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl p-6 flex items-center gap-4"
                    >
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">
                            <FaUsers />
                        </div>
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Users</h3>
                            <p className="text-4xl font-bold text-gray-800">{stats.total_users}</p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl p-6 flex items-center gap-4"
                    >
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-3xl">
                            <FaBullhorn />
                        </div>
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Shoutouts</h3>
                            <p className="text-4xl font-bold text-gray-800">{stats.total_shoutouts}</p>
                        </div>
                    </motion.div>
                </div>

                {/* Community Highlights Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Top Contributors */}
                    <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-yellow-500">🏆</span> Top Contributors
                        </h3>
                        <div className="space-y-3">
                            {topContributors.map((item, index) => (
                                <div key={item.user.id} className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.user.name}</p>
                                            <p className="text-xs text-gray-500">{item.user.department || 'No Dept'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                                        {item.count} Shoutouts
                                    </div>
                                </div>
                            ))}
                            {topContributors.length === 0 && (
                                <p className="text-gray-500 text-center text-sm">No activity yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Most Tagged */}
                    <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-pink-500">🌟</span> Most Appreciated
                        </h3>
                        <div className="space-y-3">
                            {mostTagged.map((item, index) => (
                                <div key={item.user.id} className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.user.name}</p>
                                            <p className="text-xs text-gray-500">{item.user.department || 'No Dept'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-pink-100 text-pink-800 text-xs px-3 py-1 rounded-full font-medium">
                                        {item.count} Mentions
                                    </div>
                                </div>
                            ))}
                            {mostTagged.length === 0 && (
                                <p className="text-gray-500 text-center text-sm">No activity yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Settings Section */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-200/50 bg-white/30">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FaCog className="text-gray-600" /> Global Settings
                        </h2>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Allow Comments</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    {allowComments
                                        ? "Users can comment on shoutouts."
                                        : "Commenting is currently DISABLED for all users."}
                                </p>
                            </div>

                            <button
                                onClick={() => toggleSetting('allow_comments', allowComments, setAllowComments)}
                                className={`
                                    relative inline-flex items-center h-8 w-16 px-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                                    ${allowComments ? 'bg-purple-600' : 'bg-gray-400'}
                                `}
                            >
                                <span className="sr-only">Toggle Comments</span>
                                <span
                                    className={`
                                        inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-200 shadow
                                        ${allowComments ? 'translate-x-8' : 'translate-x-0'}
                                    `}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200/50">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Allow Reactions</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    {allowReactions
                                        ? "Users can react to shoutouts."
                                        : "Reactions are currently DISABLED for all users."}
                                </p>
                            </div>

                            <button
                                onClick={() => toggleSetting('allow_reactions', allowReactions, setAllowReactions)}
                                className={`
                                    relative inline-flex items-center h-8 w-16 px-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                                    ${allowReactions ? 'bg-purple-600' : 'bg-gray-400'}
                                `}
                            >
                                <span className="sr-only">Toggle Reactions</span>
                                <span
                                    className={`
                                        inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-200 shadow
                                        ${allowReactions ? 'translate-x-8' : 'translate-x-0'}
                                    `}
                                />
                            </button>
                        </div>
                    </div>

                </div>

                {/* User Management Section */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-200/50 bg-white/30">
                        <div className="flex justify-between items-center w-full">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FaUsers className="text-blue-600" /> User Management
                            </h2>
                            <button
                                onClick={handleExportUsers}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-md"
                            >
                                <FaDownload /> Export CSV
                            </button>
                        </div>
                    </div>
                    <div className="p-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/50 divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className={user.is_deleted === 'true' ? 'bg-gray-100 opacity-60' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.name} {user.is_deleted === 'true' && <span className="text-red-500 text-xs ml-1">(Deleted)</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {user.is_deleted === 'true' ? (
                                                <span className="text-gray-400 italic">Deleted</span>
                                            ) : (
                                                <>
                                                    {user.role === 'employee' ? (
                                                        <button
                                                            onClick={() => handleRoleUpdate(user.id, 'admin')}
                                                            className="text-purple-600 hover:text-purple-900 font-semibold"
                                                        >
                                                            Promote
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleRoleUpdate(user.id, 'employee')}
                                                            className="text-orange-600 hover:text-orange-900 font-semibold"
                                                        >
                                                            Revoke Admin
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-900 font-semibold"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Moderation Section */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-200/50 bg-white/30">
                        <div className="flex justify-between items-center w-full">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FaTasks className="text-gray-600" /> Shoutout Management
                            </h2>
                            <button
                                onClick={handleExportShoutouts}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition shadow-md"
                            >
                                <FaDownload /> Export CSV
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {shoutouts.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No shoutouts found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/50 divide-y divide-gray-200">
                                        {shoutouts.map((shoutout) => (
                                            <React.Fragment key={shoutout.id}>
                                                <tr>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="text-sm font-medium text-gray-900">{shoutout.sender.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900 max-w-xs truncate" title={shoutout.message}>{shoutout.message}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{new Date(shoutout.created_at).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center gap-2">
                                                        {shoutout.comments && shoutout.comments.length > 0 && (
                                                            <button
                                                                onClick={() => toggleComments(shoutout.id)}
                                                                className="text-blue-600 hover:text-blue-900 text-xs font-semibold mr-2"
                                                            >
                                                                {expandedShoutouts.has(shoutout.id) ? 'Hide Comments' : `Comments (${shoutout.comments.length})`}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteShoutout(shoutout.id)}
                                                            className="text-red-900 hover:text-red-700 bg-red-100 px-3 py-1 rounded-md transition-colors font-semibold"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedShoutouts.has(shoutout.id) && (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-2 bg-gray-50">
                                                            <div className="text-sm text-gray-700 font-semibold mb-2">Comments:</div>
                                                            <div className="space-y-2 pl-4 border-l-2 border-gray-300">
                                                                {shoutout.comments.map(comment => (
                                                                    <div key={comment.id} className="flex justify-between items-center group">
                                                                        <div>
                                                                            <span className="font-bold text-gray-800 text-xs mr-2">{comment.user.name}:</span>
                                                                            <span className="text-gray-600 text-xs">{comment.content}</span>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleDeleteComment(comment.id, shoutout.id)}
                                                                            className="text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-white/60 text-xs pb-4">
                BragBoard Admin System
            </div>
        </div>
    );
};

export default AdminDashboard;
