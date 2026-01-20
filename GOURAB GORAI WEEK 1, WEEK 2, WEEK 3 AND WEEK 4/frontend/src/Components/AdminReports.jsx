import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { FaArrowLeft, FaHome, FaSignOutAlt, FaTimes, FaTrash, FaCheck } from "react-icons/fa";
import InteractiveBackground from './InteractiveBackground';
import './ProfilePage.css';

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/reports/admin/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch reports');
            const data = await response.json();
            setReports(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (reportId, action) => {
        if (!confirm(`Are you sure you want to ${action} this report?`)) return;

        try {
            const token = sessionStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/reports/admin/${reportId}/resolve?action=${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to resolve report');

            // Remove from local state
            setReports(reports.filter(r => r.id !== reportId));

        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        navigate('/');
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen z-10 relative text-white">
            <InteractiveBackground />
            Loading reports...
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-screen z-10 relative text-red-200">
            <InteractiveBackground />
            Error: {error}
        </div>
    );

    return (
        <div className="profile-page-container font-sans text-gray-800">
            <InteractiveBackground />

            {/* Branding Navbar */}
            <nav className="absolute top-0 w-full z-20 p-6 flex justify-between items-center bg-transparent">
                <motion.div
                    animate={{ x: [-20, 0], opacity: [0, 1] }}
                    className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer"
                    onClick={() => navigate('/success')}
                >
                    BragBoard
                </motion.div>

                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/success')} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium">
                        <FaHome size={20} /> <span className="hidden sm:inline">Home</span>
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors font-medium">
                        <FaSignOutAlt size={20} /> <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </nav>

            {/* Back/Home Button for consistency */}
            <div className="absolute top-24 left-6 z-20 md:top-28">
                <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <FaArrowLeft /> Back
                </button>
            </div>

            <div className="w-full max-w-4xl mx-auto relative z-10 px-4 mt-32 pb-10">
                <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Admin Report Management</h1>

                <motion.div
                    className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 min-h-[400px]"
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {reports.length === 0 ? (
                        <div className="text-center text-gray-500 py-10 text-lg">
                            No active reports found.
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {reports.map((report) => (
                                <motion.div
                                    key={report.id}
                                    animate={{ opacity: 1 }}
                                    className="bg-white/60 rounded-xl shadow-sm p-6 border-l-4 border-red-500 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <span className="inline-block px-3 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full mb-2">
                                                {report.shoutout_id ? 'Inappropriate Shoutout' : 'Inappropriate Comment'}
                                            </span>
                                            <p className="text-gray-900 font-semibold text-lg mb-1">Reason: {report.reason}</p>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p>Reported ID: <span className="font-mono bg-gray-100 px-1 rounded">{report.shoutout_id || report.comment_id}</span></p>
                                                <p>Reported By: {report.reporter ? report.reporter.name : `User #${report.reported_by}`}</p>
                                                <p>Date: {new Date(report.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 w-full md:w-auto">
                                            <button
                                                onClick={() => handleResolve(report.id, 'ignore')}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                                            >
                                                <FaTimes /> Ignore
                                            </button>
                                            <button
                                                onClick={() => handleResolve(report.id, 'delete')}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow hover:shadow-red-500/30 transition font-medium"
                                            >
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>


        </div>
    );
};

export default AdminReports;
