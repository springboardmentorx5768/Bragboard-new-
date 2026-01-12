import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaEnvelope, FaBuilding, FaUserTie, FaCalendarAlt, FaArrowLeft, FaHome, FaSignOutAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import InteractiveBackground from './InteractiveBackground';
import ShoutoutFeed from './ShoutoutFeed';
import './ProfilePage.css';

import API_BASE from "../config";
import { getImageUrl } from '../utils/imageUtils';

export default function Profile() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');

    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        navigate('/');
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = sessionStorage.getItem('access_token');
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

    if (error) return (
        <div className="flex flex-col justify-center items-center h-screen z-10 relative bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
                <p className="text-red-500 text-lg mb-4">{error}</p>
                <button
                    onClick={handleLogout}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Go to Login
                </button>
            </div>
        </div>
    );
    if (!user) return <div className="flex justify-center items-center h-screen z-10 relative">Loading...</div>;

    return (
        <div className="profile-page-container">
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

            {/* Back Button (Optional but good for UX) */}
            <div className="absolute top-24 left-6 z-20 md:top-28">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <FaArrowLeft /> Back
                </button>
            </div>

            <motion.div
                key={location.key}
                className="w-full max-w-lg relative z-10 px-4 mt-20 md:mt-0"
            >
                <div className="animate-float">
                    <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">My Profile</h1>

                    <motion.div
                        className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 space-y-6"
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden border-2 border-white shadow-sm">
                                {user.profile_picture ? (
                                    <img src={getImageUrl(user.profile_picture)} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <FaUser className="text-2xl" />
                                )}
                            </div>
                            <p className="text-lg text-gray-800"><span className="font-semibold block text-sm text-gray-500">Name</span> {user.name}</p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                                <FaEnvelope className="text-xl" />
                            </div>
                            <p className="text-lg text-gray-800"><span className="font-semibold block text-sm text-gray-500">Email</span> {user.email}</p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <FaBuilding className="text-xl" />
                            </div>
                            <p className="text-lg text-gray-800"><span className="font-semibold block text-sm text-gray-500">Department</span> {user.department || 'Not Set'}</p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <FaUserTie className="text-xl" />
                            </div>
                            <p className="text-lg text-gray-800"><span className="font-semibold block text-sm text-gray-500">Role</span> <span className="capitalize">{user.role}</span></p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                                <FaCalendarAlt className="text-xl" />
                            </div>
                            <p className="text-lg text-gray-800"><span className="font-semibold block text-sm text-gray-500">Joined On</span> {new Date(user.joined_at).toLocaleDateString()}</p>
                        </div>
                    </motion.div>

                    <div className="mt-8 text-center">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/profile/edit')}
                            className="w-full max-w-xs mx-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl shadow-lg hover:shadow-blue-500/30 transition font-semibold"
                        >
                            Edit Profile
                        </motion.button>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">My Posts</h2>
                        <ShoutoutFeed userId={user.id} />
                    </div>
                </div>
            </motion.div>

            {/* Simple Footer */}
            <div className="absolute bottom-4 text-center text-gray-400 text-xs z-10 w-full">
                BragBoard Profile System
            </div>
        </div >
    );
}
