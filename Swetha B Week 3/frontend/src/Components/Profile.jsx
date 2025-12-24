import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaBuilding, FaUserTie, FaCalendarAlt } from "react-icons/fa";
import { motion } from "framer-motion";

const API_BASE = "http://localhost:8000";

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
        hidden: { opacity: 0, y: 10, scale: 0.995 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
    };

    if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;
    if (!user) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
    <div
    className="min-h-screen flex items-center justify-center bg-cover bg-center"
    style={{ backgroundImage: "url('/200.jpg')" }}
  >
            <div className="w-full max-w-lg">
                <h1 className="text-4xl font-bold text-center mb-10 text-gray-100">My Profile</h1>

                <motion.div
                    className="bg-white p-8 rounded-2xl shadow-xl space-y-6 border border-gray-100"
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                >
                    
                    <div className="flex items-center space-x-4">
                        <FaUser className="text-blue-600 text-xl" />
                        <p className="text-lg"><b>Name:</b> {user.name}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <FaEnvelope className="text-red-500 text-xl" />
                        <p className="text-lg"><b>Email:</b> {user.email}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <FaBuilding className="text-purple-600 text-xl" />
                        <p className="text-lg"><b>Department:</b> {user.department || 'Not Set'}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <FaUserTie className="text-green-600 text-xl" />
                        <p className="text-lg"><b>Role:</b> <span className="capitalize">{user.role}</span></p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <FaCalendarAlt className="text-orange-500 text-xl" />
                        <p className="text-lg"><b>Joined On:</b> {new Date(user.joined_at).toLocaleDateString()}</p>
                    </div>
                </motion.div>

                <div className="mt-10 space-y-4 text-center">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/profile/edit')}
                        className="w-full max-w-xs mx-auto bg-green-800 text-white py-3 rounded-xl shadow hover:bg-blue-700 transition font-semibold"
                    >
                        Edit Profile
                    </motion.button>

                </div>
                
            </div>
        </div>
    );
}