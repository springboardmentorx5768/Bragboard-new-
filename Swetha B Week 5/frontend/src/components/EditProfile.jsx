import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";

const API_BASE = "http://localhost:8000";

export default function EditProfile() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        role: '' // Added role to state to handle it, though design might not show it explicitly, we should keep it safe
    });
    const [loading, setLoading] = useState(true);
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
            setFormData({
                name: data.name,
                department: data.department || '',
                role: data.role
            });
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleSave = async () => {
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

            alert("Profile updated!");
            navigate('/profile');
        } catch (err) {
            alert(err.message);
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <div
            className="min-h-screen bg-cover bg-center px-6 flex items-center justify-center"
            style={{ backgroundImage: "url('/200.jpg')" }}
        >
            <div className="w-full max-w-lg">
                <h1 className="text-4xl font-bold text-center mb-10 text-gray-100">Edit Profile</h1>

                <motion.div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6"
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                >
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                        <input className="border border-gray-300 p-3 w-full rounded-xl shadow-sm focus:ring-2 focus:ring-blue-600 outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Department</label>
                        <input className="border border-gray-300 p-3 w-full rounded-xl shadow-sm focus:ring-2 focus:ring-purple-600 outline-none"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        />
                    </div>

                    {/* Role editing is not in the design reference, but we keep the data safe. 
              If we want to allow role editing, we should add it here. 
              For now, following "exact design", we omit the field from UI but keep it in state. */}

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave}
                        className="bg-green-600 text-white py-3 rounded-xl w-full shadow hover:bg-green-700 transition font-semibold"
                    >
                        Save Changes
                    </motion.button>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/profile')}
                        className="bg-gray-500 text-white py-3 rounded-xl w-full shadow hover:bg-gray-600 transition font-semibold"
                    >
                        Cancel
                    </motion.button>

                </motion.div>

            </div>
        </div>
    );
}
