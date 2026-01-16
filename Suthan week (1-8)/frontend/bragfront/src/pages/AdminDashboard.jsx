import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUserShield, FaUsers, FaBullhorn, FaExclamationTriangle,
    FaDownload, FaCheck, FaTrash, FaSignOutAlt, FaEdit,
    FaTrophy, FaChartLine, FaUserCog, FaSearch, FaStar, FaUser, FaRss, FaMedal,
    FaMoon, FaSun, FaFilePdf, FaRegCommentDots
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import EditUserModal from '../components/EditUserModal';
import EditReportModal from '../components/EditReportModal';
import ReactionButton, { ReactionBar } from '../components/ReactionButton';
import CommentSection from '../components/CommentSection';
import ShoutoutDetailModal from '../components/ShoutoutDetailModal';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // UI State
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'reports', 'leaderboard'
    const [leaderboardTab, setLeaderboardTab] = useState('overall'); // 'overall', 'contributors', 'tagged'
    const [reportStatusFilter, setReportStatusFilter] = useState('all'); // 'all', 'Pending', 'Resolved'
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [theme, setTheme] = useState(localStorage.getItem('adminTheme') || 'light');

    // Data State
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [leaderboard, setLeaderboard] = useState({ overall: [], top_contributors: [], most_tagged: [] });
    const [allShoutouts, setAllShoutouts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [adminFilters, setAdminFilters] = useState({
        departmentId: '',
        senderId: '',
        dateFrom: '',
        dateTo: ''
    });

    // Modal State
    const [editingUser, setEditingUser] = useState(null);
    const [editingReport, setEditingReport] = useState(null);
    const [activeComments, setActiveComments] = useState({});
    const [selectedShoutout, setSelectedShoutout] = useState(null);

    const toggleComments = (shoutoutId) => {
        setActiveComments(prev => ({
            ...prev,
            [shoutoutId]: !prev[shoutoutId]
        }));
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const headers = { 'Authorization': `Bearer ${token}` };

            const [statsRes, reportsRes, usersRes, deptsRes, leadRes, shoutRes, meRes] = await Promise.all([
                fetch('/api/admin/stats', { headers }),
                fetch('/api/admin/reports', { headers }),
                fetch('/api/admin/users', { headers }),
                fetch('/api/departments', { headers }),
                fetch('/api/admin/leaderboard', { headers }),
                fetch('/api/shoutouts/', { headers }),
                fetch('/api/me', { headers })
            ]);

            if (statsRes.status === 403) {
                alert("Access Denied: Admin only.");
                navigate('/dashboard');
                return;
            }

            if (statsRes.ok) setStats(await statsRes.json());
            if (reportsRes.ok) setReports(await reportsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
            if (deptsRes.ok) setDepartments(await deptsRes.json());
            if (leadRes.ok) setLeaderboard(await leadRes.json());
            if (shoutRes.ok) setAllShoutouts(await shoutRes.json());
            if (meRes.ok) setCurrentUser(await meRes.json());

        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('adminTheme') || 'light';
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('adminTheme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, navigate]);

    // Action Handlers
    const handleResolveReport = async (reportId) => {
        try {
            const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Refresh data to show updated status
                fetchData();
            }
        } catch (error) {
            console.error("Resolve failed", error);
        }
    };

    const handleDeleteShoutoutFromReport = async (reportId, shoutoutId) => {
        if (!window.confirm("WARNING: This will delete the reported POST. Continue?")) return;
        try {
            const res = await fetch(`/api/shoutouts/${shoutoutId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // If post deleted, the report might be auto-deleted by cascade or we should remove it
                setReports(prev => prev.filter(r => r.shoutout_id !== shoutoutId));
                alert("Post deleted successfully");
                fetchData(); // Refresh all
            }
        } catch (error) {
            console.error("Error deleting post", error);
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch('/api/admin/reports/export', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reports_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (error) {
            console.error("Export failed", error);
        }
    };

    const handleExportPDF = async () => {
        try {
            const res = await fetch('/api/admin/reports/export/pdf', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reports_audit_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (error) {
            console.error("PDF Export failed", error);
        }
    };

    const handleDeleteShoutout = async (shoutoutId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            const res = await fetch(`/api/shoutouts/${shoutoutId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setAllShoutouts(prev => prev.filter(s => s.id !== shoutoutId));
                setReports(prev => prev.filter(r => r.shoutout_id !== shoutoutId));
                fetchData();
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleDeleteComment = async (shoutoutId, commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            const res = await fetch(`/api/shoutouts/${shoutoutId}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleReaction = async (shoutoutId, type) => {
        try {
            const response = await fetch(`/api/shoutouts/${shoutoutId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type })
            });

            if (response.ok) {
                const updatedShoutout = await response.json();

                // Update specific item in allShoutouts
                setAllShoutouts(prev => prev.map(shout => {
                    if (shout.id === shoutoutId) {
                        return {
                            ...shout,
                            reaction_counts: updatedShoutout.reaction_counts,
                            current_user_reactions: updatedShoutout.current_user_reactions
                        };
                    }
                    return shout;
                }));
            }
        } catch (error) {
            console.error("Failed to react", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const filterUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_id?.includes(searchTerm)
    );

    const filteredReports = reports.filter(r => {
        if (reportStatusFilter === 'all') return true;
        return r.status === reportStatusFilter;
    });

    if (loading && !stats) return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-xl animate-pulse">Initializing Command Center...</p>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">

            {/* Sidebar */}
            <aside className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed h-screen z-30 transition-all duration-300">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-12 group cursor-pointer" onClick={() => setActiveTab('overview')}>
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-emerald-500/20">
                            <FaUserShield size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-gray-900 dark:text-white">BRAG<span className="text-emerald-500">ADMIN</span></h1>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">Control Panel</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {[
                            { id: 'overview', icon: FaChartLine, label: 'Overview' },
                            { id: 'live_feed', icon: FaRss, label: 'Live Feed' },
                            { id: 'users', icon: FaUserCog, label: 'User Management' },
                            { id: 'reports', icon: FaExclamationTriangle, label: 'Reports' },
                            { id: 'leaderboard', icon: FaTrophy, label: 'Leaderboard' },
                            { id: 'profile', icon: FaUser, label: 'My Profile' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === tab.id
                                    ? 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/40'
                                    }`}
                            >
                                <tab.icon className={activeTab === tab.id ? 'text-emerald-500' : ''} />
                                {tab.label}
                                {tab.id === 'reports' && reports.length > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                                        {reports.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-gray-100 dark:border-gray-800/50 space-y-4">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-sm font-bold"
                    >
                        {theme === 'light' ? <FaMoon /> : <FaSun />}
                        {theme === 'light' ? 'Night Mode' : 'Light Mode'}
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm font-bold">
                        <FaSignOutAlt /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-72 p-10 min-h-screen overflow-y-auto">

                {/* Header */}
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                            {activeTab === 'overview' && 'System Overview'}
                            {activeTab === 'live_feed' && 'Platform Live Feed'}
                            {activeTab === 'users' && 'User Management'}
                            {activeTab === 'reports' && 'Security & Moderation'}
                            {activeTab === 'leaderboard' && 'Performance Leaderboard'}
                            {activeTab === 'profile' && 'Admin Profile'}
                        </h2>
                        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            System Online • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </header>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { label: 'Total Workforce', value: stats?.overview.total_users, color: 'blue', icon: FaUsers },
                                { label: 'Shoutouts Broadcast', value: stats?.overview.total_shoutouts, color: 'purple', icon: FaBullhorn },
                                { label: 'Critical Reports', value: stats?.overview.pending_reports, color: 'red', icon: FaExclamationTriangle, urgent: reports.length > 0 },
                            ].map((card, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800/40 backdrop-blur-md p-8 rounded-[2rem] border border-gray-200 dark:border-gray-700/50 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
                                    <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 dark:opacity-10 rounded-bl-full bg-${card.color}-500 group-hover:w-40 group-hover:h-40 transition-all duration-500`}></div>
                                    <div className="relative z-10">
                                        <div className={`p-4 bg-${card.color}-500/10 rounded-2xl text-${card.color}-600 dark:text-${card.color}-400 inline-block mb-6`}>
                                            <card.icon size={24} />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest mb-1">{card.label}</p>
                                        <h3 className={`text-5xl font-black ${card.urgent ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{card.value}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-gray-800/40 p-8 rounded-[2rem] border border-gray-200 dark:border-gray-700/50 shadow-xl">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 border-l-4 border-emerald-500 pl-4">Creator Activity</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats?.top_contributors?.map(i => ({ name: i.user.name, count: i.count })) || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2d3748' : '#e2e8f0'} vertical={false} />
                                            <XAxis dataKey="name" stroke={theme === 'dark' ? '#718096' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke={theme === 'dark' ? '#718096' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                                contentStyle={{
                                                    backgroundColor: theme === 'dark' ? '#1a202c' : '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '16px',
                                                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                                                }}
                                                itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                                            />
                                            <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={32}>
                                                {stats?.top_contributors?.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={`hsl(160, 70%, ${theme === 'dark' ? 50 - index * 8 : 40 - index * 8}%)`} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800/40 p-8 rounded-[2rem] border border-gray-200 dark:border-gray-700/50 shadow-xl">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 border-l-4 border-blue-500 pl-4">Recognition Stars</h3>
                                <div className="space-y-4">
                                    {stats?.most_appreciated?.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-700/30 hover:border-emerald-500/50 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img
                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.name === 'Suthan' ? 'SuthanMale' : item.user.id}`}
                                                        className="w-12 h-12 rounded-xl border-2 border-emerald-500/20"
                                                        alt=""
                                                    />
                                                    {idx < 3 && <div className="absolute -top-2 -left-2 bg-yellow-400 text-black text-[8px] font-black px-1 rounded-sm shadow-lg">TOP {idx + 1}</div>}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 dark:text-gray-100">{item.user.name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter font-bold">{item.user.role === 'admin' ? 'Administration' : (item.user.department?.name || 'Central Org')}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="text-2xl font-black text-emerald-600 dark:text-white">{item.count}</div>
                                                <div className="text-[8px] text-gray-500 font-bold uppercase">Points</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <div className="relative w-full max-w-md">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email or employee ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 pl-12 pr-6 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-900/80 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-6">Identity</th>
                                            <th className="px-8 py-6">Employee ID</th>
                                            <th className="px-8 py-6">Department</th>
                                            <th className="px-8 py-6">Access Level</th>
                                            <th className="px-8 py-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50 text-sm">
                                        {filterUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-emerald-500/5 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name === 'Suthan' ? 'SuthanMale' : user.id}`} className="w-10 h-10 rounded-lg" alt="" />
                                                        <div>
                                                            <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{user.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-mono text-xs text-emerald-500 font-bold">{user.user_id || '---'}</td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-900/50 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                        {user.role === 'admin' ? 'Administration' : (user.department?.name || 'Unassigned')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        className="p-2 bg-gray-100 dark:bg-gray-900/50 hover:bg-emerald-500 text-gray-500 dark:text-gray-400 hover:text-white rounded-lg transition-all border border-gray-200 dark:border-gray-700"
                                                    >
                                                        <FaEdit size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Content Moderation</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Review reported content and maintain community standards.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-200 dark:border-gray-800 mr-4">
                                    {['all', 'Pending', 'Resolved'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setReportStatusFilter(status)}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${reportStatusFilter === status
                                                ? 'bg-white dark:bg-gray-800 text-emerald-500 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-emerald-500 hover:text-white text-gray-600 dark:text-gray-300 rounded-2xl transition-all shadow-md text-xs font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700"
                                >
                                    <FaDownload /> CSV Audit Log
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all shadow-lg shadow-indigo-900/20 text-xs font-black uppercase tracking-widest"
                                >
                                    <FaFilePdf /> PDF Audit Log
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-900/80 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-6 text-center">UID</th>
                                            <th className="px-8 py-6">Status</th>
                                            <th className="px-8 py-6">Infraction Reason</th>
                                            <th className="px-8 py-6">Target Shoutout</th>
                                            <th className="px-8 py-6">Timestamp</th>
                                            <th className="px-8 py-6 text-right whitespace-nowrap">Resolution Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50 text-sm">
                                        {filteredReports.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-8 py-20 text-center text-gray-400 dark:text-gray-500 italic font-medium">
                                                    <div className="flex flex-col items-center gap-4 opacity-50">
                                                        <FaCheck className="text-6xl text-emerald-500" />
                                                        <p className="text-lg">No {reportStatusFilter === 'all' ? '' : reportStatusFilter.toLowerCase()} reports to display.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredReports.map(report => (
                                                <tr key={report.id} className="hover:bg-red-500/5 transition-all group">
                                                    <td className="px-8 py-6 font-mono text-[10px] text-gray-600">#{report.id}</td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${report.status === 'Pending'
                                                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                            }`}>
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-gray-700 dark:text-gray-300 font-bold text-sm bg-gray-100 dark:bg-gray-900/50 px-3 py-1 rounded-lg inline-block border border-gray-200 dark:border-gray-800">
                                                            {report.reason}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-3 max-w-xs">
                                                            <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">
                                                                REF-{report.shoutout_id}
                                                            </div>
                                                            {report.shoutout ? (
                                                                <>
                                                                    <div className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{report.shoutout.title || 'No Title'}</div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic mb-2">"{report.shoutout.message}"</div>

                                                                    {/* Simple comments list for moderation in reports tab */}
                                                                    {report.shoutout.comments?.length > 0 && (
                                                                        <div className="mt-2 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Linked Comments</p>
                                                                            {report.shoutout.comments.map(comment => (
                                                                                <div key={comment.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/40 p-2 rounded-lg border border-gray-100 dark:border-gray-800 group/repcomment">
                                                                                    <span className="text-[10px] text-gray-500 line-clamp-1">"{comment.content}"</span>
                                                                                    <button
                                                                                        onClick={() => handleDeleteComment(report.shoutout_id, comment.id)}
                                                                                        className="text-red-500 opacity-0 group-hover/repcomment:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded"
                                                                                    >
                                                                                        <FaTrash size={8} />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="text-xs text-red-400 italic">Content already removed</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-xs text-gray-500">{new Date(report.created_at).toLocaleString()}</td>
                                                    <td className="px-8 py-6 text-right whitespace-nowrap">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setEditingReport(report)}
                                                                className="px-4 py-2 bg-gray-900/50 hover:bg-indigo-500 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2"
                                                                title="Edit Report Details"
                                                            >
                                                                <FaEdit size={12} /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleResolveReport(report.id)}
                                                                disabled={report.status === 'Resolved'}
                                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${report.status === 'Resolved'
                                                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20'
                                                                    }`}
                                                                title={report.status === 'Resolved' ? "Already resolved" : (report.shoutout ? "Mark as resolved" : "Clear report for removed content")}
                                                            >
                                                                <FaCheck size={12} /> {report.status === 'Resolved' ? 'Resolved' : (report.shoutout ? 'Resolve' : 'Clean Up')}
                                                            </button>
                                                            {report.shoutout && (
                                                                <button
                                                                    onClick={() => handleDeleteShoutoutFromReport(report.id, report.shoutout_id)}
                                                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 shadow-lg shadow-red-500/10"
                                                                    title="NukeOUT: Delete post and all associated reports"
                                                                >
                                                                    <FaTrash size={12} /> NukEOUT
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                        {/* Sub-navigation for Leaderboard */}
                        <div className="flex justify-center gap-2 mb-8">
                            {[
                                { id: 'overall', label: 'Overall', icon: FaTrophy, color: 'emerald' },
                                { id: 'contributors', label: 'Top Contributors', icon: FaBullhorn, color: 'purple' },
                                { id: 'tagged', label: 'Most Tagged', icon: FaStar, color: 'pink' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setLeaderboardTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${leaderboardTab === tab.id
                                        ? `bg-${tab.color}-500 text-white border-${tab.color}-500 shadow-lg shadow-${tab.color}-500/20 scale-105`
                                        : `bg-gray-800/40 text-gray-500 border-transparent hover:border-gray-700`
                                        }`}
                                >
                                    <tab.icon size={12} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {leaderboardTab === 'overall' && (
                                <motion.div
                                    key="overall"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-12"
                                >
                                    {/* Podium Section */}
                                    <div className="flex items-end justify-center gap-4 md:gap-12 pt-10">
                                        {/* 2nd Place */}
                                        {leaderboard.overall[1] && (
                                            <div className="flex flex-col items-center">
                                                <div className="relative mb-4 group cursor-pointer">
                                                    <div className="absolute -inset-2 bg-gray-400/20 rounded-full blur-xl group-hover:bg-gray-400/40 transition-all duration-500"></div>
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard.overall[1].user.id}`} className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-gray-300 relative z-10 bg-white dark:bg-gray-900 shadow-xl" alt="" />
                                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gray-400 text-white font-black px-2 py-0.5 rounded-full z-20 text-[10px] shadow-lg">#2</div>
                                                </div>
                                                <div className="w-28 md:w-36 bg-white dark:bg-gray-800 h-28 md:h-36 rounded-t-3xl flex flex-col items-center justify-center border-x border-t border-gray-200 dark:border-gray-700 shadow-2xl transition-colors duration-300">
                                                    <span className="font-bold text-gray-900 dark:text-white text-xs md:text-sm px-2 text-center line-clamp-1">{leaderboard.overall[1].user.name}</span>
                                                    <span className="text-xl md:text-3xl font-black text-emerald-500">{leaderboard.overall[1].points}</span>
                                                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Points</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* 1st Place */}
                                        {leaderboard.overall[0] && (
                                            <div className="flex flex-col items-center z-10">
                                                <div className="relative mb-4 group cursor-pointer -translate-y-6">
                                                    <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-2xl group-hover:bg-yellow-500/40 transition-all duration-700"></div>
                                                    <FaMedal className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-500 drop-shadow-[0_10px_10px_rgba(234,179,8,0.4)] animate-pulse" size={40} />
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard.overall[0].user.id}`} className="w-28 h-28 md:w-36 md:h-36 rounded-full border-8 border-yellow-500 relative z-10 bg-white dark:bg-gray-900 shadow-2xl shadow-yellow-500/10" alt="" />
                                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-black px-4 py-1 rounded-full z-20 text-[10px] shadow-xl tracking-tighter">LEADING</div>
                                                </div>
                                                <div className="w-32 md:w-44 bg-white dark:bg-gray-800 h-40 md:h-52 rounded-t-[3rem] flex flex-col items-center justify-center border-x border-t border-yellow-500/30 shadow-[0_-20px_60px_-20px_rgba(234,179,8,0.3)] transition-colors duration-300">
                                                    <span className="font-extrabold text-gray-900 dark:text-white text-sm md:text-base px-2 text-center line-clamp-1">{leaderboard.overall[0].user.name}</span>
                                                    <span className="text-3xl md:text-5xl font-black text-yellow-500">{leaderboard.overall[0].points}</span>
                                                    <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest mt-1">CHAMPION</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* 3rd Place */}
                                        {leaderboard.overall[2] && (
                                            <div className="flex flex-col items-center">
                                                <div className="relative mb-4 group cursor-pointer">
                                                    <div className="absolute -inset-2 bg-orange-700/10 rounded-full blur-xl group-hover:bg-orange-700/30 transition-all duration-500"></div>
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard.overall[2].user.id}`} className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-orange-700/40 relative z-10 bg-white dark:bg-gray-900 shadow-xl" alt="" />
                                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-orange-700 text-white font-black px-2 py-0.5 rounded-full z-20 text-[10px] shadow-lg">#3</div>
                                                </div>
                                                <div className="w-28 md:w-36 bg-white dark:bg-gray-800 h-20 md:h-28 rounded-t-3xl flex flex-col items-center justify-center border-x border-t border-gray-200 dark:border-gray-700 shadow-2xl transition-colors duration-300">
                                                    <span className="font-bold text-gray-900 dark:text-white text-xs md:text-sm px-2 text-center line-clamp-1">{leaderboard.overall[2].user.name}</span>
                                                    <span className="text-xl md:text-3xl font-black text-emerald-500">{leaderboard.overall[2].points}</span>
                                                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Points</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Overall List */}
                                    <div className="space-y-6 max-w-5xl mx-auto">
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                            <span className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500"><FaTrophy size={16} /></span>
                                            Overall Rankings
                                        </h2>
                                        <div className="grid grid-cols-1 gap-4">
                                            {leaderboard.overall.map((entry, idx) => (
                                                <div key={entry.user.id} className="bg-white dark:bg-gray-800/40 backdrop-blur-sm p-4 rounded-3xl border border-gray-100 dark:border-gray-700/50 flex items-center gap-4 hover:border-emerald-500/30 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/60 shadow-xl group">
                                                    <div className={`w-8 text-center font-black ${idx < 3 ? 'text-emerald-500' : 'text-gray-400'}`}>#{idx + 1}</div>
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.name === 'Suthan' ? 'SuthanMale' : (entry.user.id)}`} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" alt="" />
                                                    <div className="flex-1">
                                                        <p className="font-black text-gray-900 dark:text-white text-base leading-none">{entry.user.name}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1 leading-none">{entry.user.department?.name || 'Central Team'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-emerald-400 tabular-nums leading-none">{entry.points}</p>
                                                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest mt-1 leading-none">Points</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {leaderboardTab === 'contributors' && (
                                <motion.div
                                    key="contributors"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6 max-w-3xl mx-auto"
                                >
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                        <span className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500"><FaBullhorn size={16} /></span>
                                        Top Contributors
                                    </h2>
                                    <div className="space-y-3">
                                        {leaderboard.top_contributors.map((entry, idx) => (
                                            <div key={idx} className="bg-white dark:bg-gray-800/20 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/50 flex items-center gap-4 transition-all hover:bg-gray-800/40">
                                                <span className="font-black text-gray-400 w-8 text-lg">#{idx + 1}</span>
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.name === 'Suthan' ? 'SuthanMale' : entry.user.id}`} className="w-12 h-12 rounded-2xl" alt="" />
                                                <div className="flex-1">
                                                    <p className="font-black text-base text-gray-900 dark:text-white leading-none">{entry.user.name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black mt-1 leading-none">{entry.user.department?.name}</p>
                                                </div>
                                                <div className="bg-purple-500/10 text-purple-500 px-4 py-2 rounded-2xl font-black text-sm">
                                                    {entry.count} Posts
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {leaderboardTab === 'tagged' && (
                                <motion.div
                                    key="tagged"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6 max-w-3xl mx-auto"
                                >
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                        <span className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center text-pink-500"><FaStar size={16} /></span>
                                        Most Tagged
                                    </h2>
                                    <div className="space-y-3">
                                        {leaderboard.most_tagged.map((entry, idx) => (
                                            <div key={idx} className="bg-white dark:bg-gray-800/20 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/50 flex items-center gap-4 transition-all hover:bg-gray-800/40">
                                                <span className="font-black text-gray-400 w-8 text-lg">#{idx + 1}</span>
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.name === 'Suthan' ? 'SuthanMale' : entry.user.id}`} className="w-12 h-12 rounded-2xl" alt="" />
                                                <div className="flex-1">
                                                    <p className="font-black text-base text-gray-900 dark:text-white leading-none">{entry.user.name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black mt-1 leading-none">{entry.user.department?.name}</p>
                                                </div>
                                                <div className="bg-pink-500/10 text-pink-500 px-4 py-2 rounded-2xl font-black text-sm">
                                                    {entry.count} Tagged
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
                {activeTab === 'live_feed' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500 text-sm font-medium">Monitor all platform activity and moderate content in real-time.</p>
                        </div>

                        {/* Filter Bar */}
                        <div className="bg-gray-800/30 p-6 rounded-3xl border border-gray-700/50 flex flex-wrap gap-6 items-center shadow-inner">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Department</label>
                                <select
                                    className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500 transition-all"
                                    value={adminFilters.departmentId}
                                    onChange={(e) => setAdminFilters({ ...adminFilters, departmentId: e.target.value })}
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sender</label>
                                <select
                                    className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500 transition-all"
                                    value={adminFilters.senderId}
                                    onChange={(e) => setAdminFilters({ ...adminFilters, senderId: e.target.value })}
                                >
                                    <option value="">All Users</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">From Date</label>
                                <input
                                    type="date"
                                    className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:border-emerald-500 transition-all"
                                    value={adminFilters.dateFrom}
                                    onChange={(e) => setAdminFilters({ ...adminFilters, dateFrom: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">To Date</label>
                                <input
                                    type="date"
                                    className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:border-emerald-500 transition-all"
                                    value={adminFilters.dateTo}
                                    onChange={(e) => setAdminFilters({ ...adminFilters, dateTo: e.target.value })}
                                />
                            </div>
                            {(adminFilters.departmentId || adminFilters.senderId || adminFilters.dateFrom || adminFilters.dateTo) && (
                                <button
                                    onClick={() => setAdminFilters({ departmentId: '', senderId: '', dateFrom: '', dateTo: '' })}
                                    className="mt-5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {allShoutouts
                                .filter(shout => {
                                    if (adminFilters.departmentId && shout.sender?.department_id !== parseInt(adminFilters.departmentId)) return false;
                                    if (adminFilters.senderId && shout.sender_id !== parseInt(adminFilters.senderId)) return false;
                                    if (adminFilters.dateFrom && new Date(shout.created_at) < new Date(adminFilters.dateFrom)) return false;
                                    if (adminFilters.dateTo) {
                                        const end = new Date(adminFilters.dateTo);
                                        end.setHours(23, 59, 59, 999);
                                        if (new Date(shout.created_at) > end) return false;
                                    }
                                    return true;
                                })
                                .map(shout => {
                                    // Process date for display
                                    let dateString = 'Just now';
                                    if (shout.created_at) {
                                        const createdDate = new Date(shout.created_at);
                                        if (!isNaN(createdDate.getTime())) {
                                            dateString = createdDate.toLocaleString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                        }
                                    }

                                    return (
                                        <div
                                            key={shout.id}
                                            className="bg-white dark:bg-gray-800/40 p-8 rounded-[2rem] border border-gray-200 dark:border-gray-700/50 shadow-xl group hover:border-emerald-500/30 transition-all cursor-pointer relative"
                                            onClick={() => setSelectedShoutout(shout)}
                                        >
                                            <div className="absolute top-8 right-8 flex gap-2 z-10">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteShoutout(shout.id); }}
                                                    className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 shadow-lg shadow-red-500/10"
                                                    title="Delete Post"
                                                >
                                                    <FaTrash size={16} />
                                                </button>
                                            </div>

                                            <div className="flex gap-6">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${shout.sender?.name === 'Suthan' ? 'SuthanMale' : (shout.sender?.id || shout.sender_id)}`}
                                                    className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-700 shadow-lg transition-transform group-hover:scale-105"
                                                    alt=""
                                                />
                                                <div className="flex-1">
                                                    <div className="mb-4">
                                                        <h4 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                                                            {shout.sender?.name}
                                                            <span className="text-gray-500 dark:text-gray-400 font-medium text-sm ml-2">sent a post to</span>
                                                            <span className="text-amber-600 dark:text-amber-500 font-bold text-sm ml-2">
                                                                {Array.isArray(shout.recipients) && shout.recipients.length > 0
                                                                    ? shout.recipients.map(r => r.recipient?.name || 'Unknown').join(', ')
                                                                    : 'Someone'}
                                                            </span>
                                                        </h4>
                                                        <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mt-1">
                                                            {shout.sender?.role === 'admin' ? 'Administration' : (shout.sender?.department?.name || 'General')}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 font-bold mt-1 tracking-wider">{dateString}</p>
                                                    </div>

                                                    <div className="bg-gray-900/40 p-6 rounded-[1.5rem] border border-gray-800/50 mb-6 relative overflow-hidden group-hover:bg-gray-900/60 transition-colors">
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8"></div>
                                                        {shout.title && <h5 className="font-black text-emerald-400 mb-3 uppercase tracking-widest text-xs italic">{shout.title}</h5>}
                                                        <p className="text-gray-300 text-lg italic leading-relaxed">"{shout.message}"</p>

                                                        {shout.image_url && (
                                                            <img
                                                                src={shout.image_url}
                                                                alt="Post Content"
                                                                className="rounded-2xl mt-6 max-h-96 w-full object-cover shadow-2xl border border-gray-800 hover:scale-[1.01] transition-transform duration-500"
                                                            />
                                                        )}

                                                        {shout.tags && (
                                                            <div className="flex gap-2 flex-wrap mt-6">
                                                                {shout.tags.split(',').map((tag, i) => (
                                                                    <span key={i} className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                                                                        #{tag.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Reactions and Interaction */}
                                                    <div className="space-y-4">
                                                        <ReactionBar counts={shout.reaction_counts} />

                                                        <div className="flex items-center gap-4 pt-4 border-t border-gray-800/50">
                                                            <div className="flex-1" onClick={e => e.stopPropagation()}>
                                                                <ReactionButton
                                                                    shoutoutId={shout.id}
                                                                    userReactions={shout.current_user_reactions}
                                                                    onReact={handleReaction}
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleComments(shout.id); }}
                                                                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-gray-800 transition-all rounded-xl border border-transparent hover:border-gray-700"
                                                                >
                                                                    <FaRegCommentDots className="text-lg" />
                                                                    <span className="hidden sm:inline">Comment</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {activeComments[shout.id] && (
                                                            <div className="mt-4 pt-4 border-t border-gray-800/50 animate-in fade-in slide-in-from-top-2 duration-300" onClick={e => e.stopPropagation()}>
                                                                <CommentSection
                                                                    shoutoutId={shout.id}
                                                                    currentUser={currentUser}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && currentUser && (
                    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gray-800/40 p-10 rounded-[3rem] border border-gray-700/50 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
                                <div className="relative">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name === 'Suthan' ? 'SuthanMale' : currentUser.id}`} className="w-40 h-40 rounded-[2.5rem] bg-gray-100 dark:bg-gray-900 border-4 border-emerald-500/20 shadow-2xl shadow-emerald-500/10" alt="" />
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg">ADMINISTRATOR</div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">{currentUser.name}</h3>
                                    <p className="text-emerald-500 font-bold mb-6">{currentUser.email}</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/50">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Employee ID</p>
                                            <p className="text-gray-900 dark:text-white font-mono font-bold">{currentUser.user_id || '---'}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/50">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Department</p>
                                            <p className="text-gray-900 dark:text-white font-bold">{currentUser.role === 'admin' ? 'Administration' : (currentUser.department?.name || 'Central Command')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            <EditUserModal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                user={editingUser}
                departments={departments}
                onUpdate={(updated) => {
                    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                    setEditingUser(null);
                }}
            />
            <EditReportModal
                isOpen={!!editingReport}
                onClose={() => setEditingReport(null)}
                report={editingReport}
                onUpdate={(updated) => {
                    setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
                    setEditingReport(null);
                }}
            />
            {selectedShoutout && (
                <ShoutoutDetailModal
                    shoutout={selectedShoutout}
                    currentUser={currentUser}
                    onClose={() => setSelectedShoutout(null)}
                    onReact={handleReaction}
                    onDelete={handleDeleteShoutout}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
