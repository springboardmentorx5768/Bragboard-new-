import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaBullhorn, FaFlag, FaDownload, FaCheck, FaTrash } from "react-icons/fa";
import { API_BASE_URL } from '../config';

const AdminDashboard = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAdminData = async () => {
        try {
            // Fetch Stats
            const resStats = await fetch(`${API_BASE_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resStats.ok) setStats(await resStats.json());

            // Fetch Reports
            const resReports = await fetch(`${API_BASE_URL}/admin/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Reports Status:", resReports.status); // Debug
            if (resReports.ok) {
                const data = await resReports.json();
                console.log("Reports Data:", data); // Debug
                setReports(data);
            } else {
                console.error("Failed to load reports:", resReports.status);
                // alert("Admin Error: Failed to load reports. Status: " + resReports.status);
            }
        } catch (err) {
            console.error("Error loading admin data", err);
            // alert("Network Error loading admin data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchAdminData();
    }, [token]);

    const handleResolve = async (reportId) => {
        if (!window.confirm("Dismiss this report? The content will remain visible.")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/reports/${reportId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setReports(reports.filter(r => r.id !== reportId));
                alert("Report dismissed active.");
            } else {
                alert("Failed to dismiss report.");
            }
        } catch (err) {
            console.error("Error resolving report", err);
            alert("Error: " + err.message);
        }
    };

    const handleDeleteContent = async (report) => {
        if (!window.confirm("ARE YOU SURE? This will permanently delete the content.")) return;

        let url = '';
        if (report.shoutout_id) {
            url = `${API_BASE_URL}/admin/shoutouts/${report.shoutout_id}`;
            // If deleting a shoutout, we also clean up the report from UI
        } else if (report.comment_id) {
            url = `${API_BASE_URL}/comments/${report.comment_id}`;
        }

        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setReports(reports.filter(r => r.id !== report.id));
                alert("Content deleted successfully.");
            } else {
                alert("Failed to delete content.");
            }
        } catch (err) {
            console.error("Error deleting content", err);
        }
    };

    const handleExport = async (type = 'csv') => {
        try {
            const endpoint = type === 'pdf' ? '/admin/export-pdf' : '/admin/export';
            const filename = type === 'pdf' ? 'reports_export.pdf' : `shoutouts_export_${new Date().toISOString().split('T')[0]}.csv`;

            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (err) {
            console.error("Export failed", err);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Admin Panel...</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 min-h-screen">
            <div className="h-24"></div> {/* Force spacer for Navbar */}
            <div className="flex flex-wrap flex-col md:flex-row justify-between items-center mb-8 gap-6 pt-4">
                <h1 className="text-3xl font-bold text-gray-900">🛡️ Admin Dashboard</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-lime-500 transition shadow-md font-semibold z-10"
                    >
                        <FaDownload /> Export CSV
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-lime-500 transition shadow-md font-semibold z-10"
                    >
                        <FaDownload /> Export PDF
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><FaUsers size={24} /></div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase">Total Users</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total_users}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><FaBullhorn size={24} /></div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase">Total Shoutouts</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total_shoutouts}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-xl text-red-600"><FaFlag size={24} /></div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold uppercase">Pending Reports</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.reports_count}</p>
                        </div>
                    </div>
                    {/* Top Sender */}
                    <div className="bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 p-6 rounded-2xl shadow-md text-white">
                        <p className="text-white/80 text-xs font-bold uppercase mb-1">🔥 Top Sender</p>
                        <p className="text-xl font-bold truncate">{stats.top_sender || "N/A"}</p>
                    </div>
                </div>
            )}

            {/* Reports Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FaFlag className="text-red-500" /> Moderation Queue
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{reports.length}</span>
                    </h2>
                </div>

                {reports.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 italic">No pending reports. Great job!</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {reports.map(report => (
                            <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded uppercase">Content Reported</span>
                                        <span className="text-gray-400 text-xs">{new Date(report.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-gray-900 font-medium mb-1">Reason: <span className="font-normal text-gray-600">{report.reason}</span></p>
                                    <p className="text-xs text-gray-500">Reported by: <span className="font-semibold">{report.reporter ? report.reporter.name : 'Unknown'}</span></p>

                                    <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">
                                            {report.shoutout_id ? `Reported Shoutout ID: ${report.shoutout_id}` : `Reported Comment ID: ${report.comment_id}`}
                                        </p>
                                        <p className="text-sm text-gray-800 italic">
                                            "{report.reports_shoutout ? report.reports_shoutout.message : (report.comment ? report.comment.content : "Content not available...")}"
                                        </p>
                                        {report.reports_shoutout && report.reports_shoutout.image_url && (
                                            <div className="mt-2 text-xs text-blue-600 underline">Contains Image</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleResolve(report.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold text-sm transition"
                                    >
                                        <FaCheck /> Dismiss Report
                                    </button>
                                    <button
                                        onClick={() => handleDeleteContent(report)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-red-700 font-bold text-sm transition shadow-sm"
                                    >
                                        <FaTrash /> Delete Content
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
