import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaBuilding, FaUserTie, FaCalendarAlt, FaArrowLeft } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

import { API_BASE_URL } from '../config';

const API_BASE = API_BASE_URL;

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        role: ''
    });
    const [message, setMessage] = useState('');
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
            setFormData({
                name: data.name,
                department: data.department || '',
                role: data.role
            });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

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

            const updatedUser = await res.json();
            setUser(updatedUser);
            setIsEditing(false);
            setMessage('Profile updated successfully!');

            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.995 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
        exit: { opacity: 0, y: -10, scale: 0.995, transition: { duration: 0.3 } }
    };

    if (!user) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <div
            className="min-h-screen bg-cover bg-center px-6 py-10 flex justify-center"
            style={{ backgroundImage: "url('/200.jpg')" }}
        >
            <div className="w-full max-w-lg relative">
                <button
                    onClick={() => navigate('/success')}
                    className="absolute left-0 top-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                    <FaArrowLeft /> Back
                </button>
                <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">
                    {isEditing ? 'Edit Profile' : 'My Profile'}
                </h1>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center"
                    >
                        {message}
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {!isEditing ? (
                        <motion.div
                            key="view"
                            className="bg-white p-8 rounded-2xl shadow-xl space-y-6 border border-gray-100"
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={cardVariants}
                        >
                            <div className="flex justify-center mb-6">
                                <img
                                    src={user.profile_image_url ? `${API_BASE}${user.profile_image_url}` : "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white"
                                />
                            </div>
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

                            <div className="mt-8 text-center pt-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsEditing(true)}
                                    className="w-full max-w-xs mx-auto bg-blue-600 text-white py-3 rounded-xl shadow hover:bg-blue-700 transition font-semibold"
                                >
                                    Edit Profile
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="edit"
                            className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6"
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={cardVariants}
                        >
                            <div className="flex justify-center mb-6 relative group w-32 h-32 mx-auto">
                                <img
                                    src={user.profile_image_url ? `${API_BASE}${user.profile_image_url}` : "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover shadow-lg border-4 border-white opacity-100"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer" onClick={() => document.getElementById('fileInput').click()}>
                                    <span className="text-white font-bold text-sm">Change</span>
                                </div>
                                <input
                                    type="file"
                                    id="fileInput"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;

                                        const formData = new FormData();
                                        formData.append('file', file);

                                        try {
                                            const token = localStorage.getItem('access_token');
                                            const res = await fetch(`${API_BASE}/users/upload-avatar`, {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: formData
                                            });
                                            if (res.ok) {
                                                const updatedUser = await res.json();
                                                setUser(updatedUser);
                                                // Force refresh or context update if needed
                                                window.location.reload();
                                            } else {
                                                alert("Failed to upload image");
                                            }
                                        } catch (err) {
                                            console.error("Upload error", err);
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                                <input
                                    className="border border-gray-300 p-3 w-full rounded-xl shadow-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Department</label>
                                <input
                                    className="border border-gray-300 p-3 w-full rounded-xl shadow-sm focus:ring-2 focus:ring-purple-600 outline-none"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Role</label>
                                <div className="relative">
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="border border-gray-300 p-3 w-full rounded-xl shadow-sm focus:ring-2 focus:ring-green-600 outline-none appearance-none bg-white"
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSubmit}
                                    className="bg-green-600 text-white py-3 rounded-xl w-full shadow hover:bg-green-700 transition font-semibold"
                                >
                                    Save Changes
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsEditing(false)}
                                    className="bg-gray-500 text-white py-3 rounded-xl w-full shadow hover:bg-gray-600 transition font-semibold"
                                >
                                    Cancel
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={async () => {
                                        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                                            try {
                                                const token = localStorage.getItem('access_token');
                                                const res = await fetch(`${API_BASE}/users/me`, {
                                                    method: 'DELETE',
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`
                                                    }
                                                });
                                                if (res.status === 204) {
                                                    localStorage.removeItem('access_token');
                                                    navigate('/');
                                                } else {
                                                    alert("Failed to delete account");
                                                }
                                            } catch (err) {
                                                console.error("Error deleting account:", err);
                                                alert("Error deleting account");
                                            }
                                        }
                                    }}
                                    className="bg-GREEN-900 text-white py-3 rounded-xl w-full shadow hover:bg-red-700 transition font-semibold mt-4"
                                >
                                    Delete Account
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ProfilePage;
