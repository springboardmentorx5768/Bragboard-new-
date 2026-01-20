import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaBuilding, FaUserTie, FaCalendarAlt, FaStar, FaBullhorn } from "react-icons/fa";
import { motion } from "framer-motion";
// ❌ ShoutoutFeed import removed

const API_BASE = "http://127.0.0.1:9000";

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                navigate('/');
                return;
            }

            const res = await fetch(`${API_BASE}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to fetch user data');

            const data = await res.json();
            setUser(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, type: "spring", stiffness: 120 } },
    };

    const iconColor = {
        name: "text-cyan-600",
        email: "text-red-600",
        department: "text-purple-600",
        role: "text-green-600",
        joined: "text-orange-600",
    }

    if (error) return <div className="text-red-400 text-center mt-10 font-bold">Error: {error}</div>;
    if (!user) return <div className="flex justify-center items-center h-screen text-white text-lg font-bold">Loading User Data...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 px-6 py-10 flex justify-center overflow-y-auto">
            <div className="w-full max-w-2xl mt-12 pb-20">
                <h1 className="text-5xl font-extrabold text-center mb-16 text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                    <FaStar className="inline-block text-yellow-300 mr-4" /> EMPLOYEE PROFILE
                </h1>

                <motion.div
                    className="bg-white p-12 rounded-[2rem] shadow-3xl space-y-8 text-gray-900" 
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                >
                    <div className="space-y-5">
                        <div className="flex items-center space-x-6">
                            <FaUser className={`${iconColor.name} text-3xl flex-shrink-0`} />
                            <p className="text-lg">
                                <span className="font-extrabold text-gray-900">Name:</span> <span className="font-semibold">{user.name}</span>
                            </p>
                        </div>

                        <div className="flex items-center space-x-6">
                            <FaEnvelope className={`${iconColor.email} text-3xl flex-shrink-0`} />
                            <p className="text-lg">
                                <span className="font-extrabold text-gray-900">Email:</span> <span className="font-semibold">{user.email}</span>
                            </p>
                        </div>

                        <div className="flex items-center space-x-6">
                            <FaBuilding className={`${iconColor.department} text-3xl flex-shrink-0`} />
                            <p className="text-lg">
                                <span className="font-extrabold text-gray-900">Department:</span> <span className="font-semibold">{user.department || 'Not Set'}</span>
                            </p>
                        </div>

                        <div className="flex items-center space-x-6">
                            <FaUserTie className={`${iconColor.role} text-3xl flex-shrink-0`} />
                            <p className="text-lg">
                                <span className="font-extrabold text-gray-900">Role:</span> <span className="capitalize font-semibold">{user.role}</span>
                            </p>
                        </div>

                        <div className="flex items-center space-x-6">
                            <FaCalendarAlt className={`${iconColor.joined} text-3xl flex-shrink-0`} />
                            <p className="text-lg">
                                <span className="font-extrabold text-gray-900">Joined On:</span> <span className="font-semibold">{new Date(user.joined_at).toLocaleDateString()}</span>
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="mt-12 flex flex-col items-center gap-6">
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 15px 30px rgba(0, 255, 255, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/profile/edit')}
                        className="w-full max-w-xs bg-gradient-to-r from-cyan-500 to-teal-400 text-gray-900 py-4 rounded-full shadow-2xl font-black text-xl tracking-wider transition duration-300"
                    >
                        EDIT PROFILE
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 15px 30px rgba(255, 215, 0, 0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/shoutout')}
                        className="w-full max-w-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 py-4 rounded-full shadow-2xl font-black text-xl tracking-wider transition duration-300 flex items-center justify-center gap-3"
                    >
                        <FaBullhorn className="text-gray-900" /> SEND SHOUT-OUT
                    </motion.button>
                </div>
                
                {/* ❌ ShoutoutFeed component removed from here */}
            </div>
        </div>
    );
}