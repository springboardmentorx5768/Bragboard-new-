import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaBuilding, FaUserTie, FaCalendarAlt, FaStar, FaBullhorn, FaTrophy, FaMedal } from "react-icons/fa";
import { motion } from "framer-motion";

const API_BASE = "http://127.0.0.1:9000";

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]); // 👈 Added leaderboard state
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserData();
        fetchLeaderboard(); // 👈 Fetch ranking data on load
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) { navigate('/'); return; }
            const res = await fetch(`${API_BASE}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch user data');
            const data = await res.json();
            setUser(data);
        } catch (err) { setError(err.message); }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`${API_BASE}/shoutouts/leaderboard`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data);
            }
        } catch (err) { console.error("Leaderboard error:", err); }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, type: "spring", stiffness: 120 } },
    };

    if (error) return <div className="text-red-400 text-center mt-10 font-bold">Error: {error}</div>;
    if (!user) return <div className="flex justify-center items-center h-screen text-white text-lg font-bold">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 px-6 py-10 flex justify-center overflow-y-auto">
            <div className="w-full max-w-2xl mt-12 pb-20">
                <h1 className="text-5xl font-extrabold text-center mb-16 text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                    <FaStar className="inline-block text-yellow-300 mr-4" /> PROFILE
                </h1>

                {/* Main Profile Card */}
                <motion.div className="bg-white p-12 rounded-[2rem] shadow-3xl space-y-8 text-gray-900" initial="hidden" animate="visible" variants={cardVariants}>
                    <div className="space-y-5">
                        <div className="flex items-center space-x-6">
                            <FaUser className="text-cyan-600 text-3xl flex-shrink-0" />
                            <p className="text-lg"><span className="font-extrabold">Name:</span> {user.name}</p>
                        </div>
                        <div className="flex items-center space-x-6">
                            <FaEnvelope className="text-red-600 text-3xl flex-shrink-0" />
                            <p className="text-lg"><span className="font-extrabold">Email:</span> {user.email}</p>
                        </div>
                        <div className="flex items-center space-x-6">
                            <FaBuilding className="text-purple-600 text-3xl flex-shrink-0" />
                            <p className="text-lg"><span className="font-extrabold">Team:</span> {user.department || 'Not Set'}</p>
                        </div>
                        <div className="flex items-center space-x-6">
                            <FaUserTie className="text-green-600 text-3xl flex-shrink-0" />
                            <p className="text-lg"><span className="font-extrabold text-gray-900 uppercase tracking-tighter text-sm">Role:</span> <span className="capitalize">{user.role}</span></p>
                        </div>
                        <div className="flex items-center space-x-6">
                            <FaCalendarAlt className="text-orange-600 text-3xl flex-shrink-0" />
                            <p className="text-lg"><span className="font-extrabold">Joined:</span> {new Date(user.joined_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="mt-12 flex flex-col items-center gap-6">
                    <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('/profile/edit')} className="w-full max-w-xs bg-gradient-to-r from-cyan-500 to-teal-400 text-gray-900 py-4 rounded-full shadow-2xl font-black text-xl tracking-wider">
                        EDIT PROFILE
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('/shoutout')} className="w-full max-w-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 py-4 rounded-full shadow-2xl font-black text-xl tracking-wider flex items-center justify-center gap-3">
                        <FaBullhorn /> SEND SHOUT-OUT
                    </motion.button>
                </div>

                {/* 🏆 LEADERBOARD SECTION: Below everything else */}
                <div className="mt-20 bg-white/10 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/20 shadow-2xl">
                    <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
                        <div className="flex items-center gap-4">
                            <FaTrophy className="text-yellow-400 text-4xl" />
                            <h3 className="text-3xl font-black text-white uppercase tracking-widest">Top Recognized</h3>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {leaderboard.map((u, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-5 bg-black/40 rounded-3xl border border-white/5 group hover:border-yellow-400/50 transition-all"
                            >
                                <div className="flex items-center gap-6">
                                    <span className={`text-2xl font-black ${index === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>#{index + 1}</span>
                                    <div>
                                        <p className="text-white font-black text-xl">{u.name}</p>
                                        <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">{u.department}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-yellow-400 text-2xl font-black">{u.score}</span>
                                    {index === 0 ? <FaMedal className="text-yellow-400 text-3xl" /> : <FaStar className="text-gray-600" />}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}