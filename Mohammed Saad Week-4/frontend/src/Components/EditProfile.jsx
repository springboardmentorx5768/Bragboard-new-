import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { FaArrowLeft, FaSave, FaTimes, FaUserEdit } from "react-icons/fa";

const API_BASE = "http://127.0.0.1:9000";

export default function EditProfile() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        role: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');


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
            setFormData({
                name: data.name,
                department: data.department || '',
                role: data.role
            });
            setLoading(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setError('');
        setMessage('');
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to update profile');

            setMessage("Profile updated successfully!");
            setTimeout(() => navigate('/profile'), 1000);
        } catch (err) {
            setError(err.message);
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-white text-lg font-bold">Loading User Data...</div>;
    if (error) return <div className="text-red-400 text-center mt-10 font-bold">Error: {error}</div>;


    return (
        // Deep Space Gradient Background
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 px-6 py-10 flex flex-col items-center">
             <div className="w-full max-w-lg relative">
                 <button
                    onClick={() => navigate('/profile')}
                    // Styled 'Back' button for visibility on dark background
                    className="absolute left-0 top-2 text-white hover:text-cyan-400 flex items-center gap-2 transition font-bold text-lg"
                >
                    <FaArrowLeft /> Back
                </button>
                {/* Main title is large and glowing */}
                <h1 className="text-4xl font-extrabold text-center mb-10 text-white tracking-wider drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                    <FaUserEdit className="inline-block text-cyan-400 mr-2" /> UPDATE DETAILS
                </h1>

                {/* Status Messages - Highly visible */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-600 text-white p-4 rounded-lg mb-6 text-center font-bold shadow-lg"
                    >
                        {message}
                    </motion.div>
                )}
                
                <motion.div 
                    // Card is white, explicitly setting base text color to dark gray, rounded corners for soft UI
                    className="bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 space-y-8 text-gray-900" 
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                >
                    <div className="text-sm text-gray-600 italic border-b border-gray-200 pb-4">Editing **{formData.name}**'s details. Note: Email is not editable.</div>
                    
                    {/* Name Input */}
                    <div>
                        <label className="block text-gray-800 font-extrabold mb-3 text-lg">Full Name</label>
                        <input className="border border-gray-300 p-4 w-full rounded-xl shadow-inner focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 outline-none transition font-semibold text-gray-900 text-lg"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Department Input */}
                    <div>
                        <label className="block text-gray-800 font-extrabold mb-3 text-lg">Department</label>
                        <input className="border border-gray-300 p-4 w-full rounded-xl shadow-inner focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition font-semibold text-gray-900 text-lg"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                        />
                    </div>
                    
                    {/* Role Select */}
                    <div>
                        <label className="block text-gray-800 font-extrabold mb-3 text-lg">Role</label>
                        <div className="relative">
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                // Explicitly ensuring text color is dark on the white background
                                className="border border-gray-300 p-4 w-full rounded-xl shadow-inner focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none appearance-none bg-white transition font-semibold text-gray-900 text-lg"
                            >
                                <option value="employee">Employee</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                                <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>


                    <div className="space-y-4 pt-6">
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(16, 185, 129, 0.5)" }} 
                            whileTap={{ scale: 0.95 }} 
                            onClick={handleSave}
                            // Save Button: Vibrant Green
                            className="bg-green-600 text-white py-4 rounded-xl w-full shadow-2xl hover:bg-green-700 transition font-extrabold text-lg flex items-center justify-center gap-2"
                        >
                            <FaSave /> SAVE CHANGES
                        </motion.button>

                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(107, 114, 128, 0.5)" }} 
                            whileTap={{ scale: 0.95 }} 
                            onClick={() => navigate('/profile')}
                            // Cancel Button: Dark Gray
                            className="bg-gray-600 text-white py-4 rounded-xl w-full shadow-2xl hover:bg-gray-700 transition font-extrabold text-lg flex items-center justify-center gap-2"
                        >
                            <FaTimes /> CANCEL
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}