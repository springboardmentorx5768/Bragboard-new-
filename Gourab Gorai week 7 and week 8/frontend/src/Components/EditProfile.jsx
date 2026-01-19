import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { FaArrowLeft, FaSave, FaTimes, FaHome, FaSignOutAlt } from "react-icons/fa";
import InteractiveBackground from './InteractiveBackground';
import './ProfilePage.css';
import CameraCapture from './CameraCapture'; // Import Camera Component


import API_BASE from "../config";
import { getImageUrl } from '../utils/imageUtils';

export default function EditProfile() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        role: ''
    });
    const [profilePic, setProfilePic] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCamera, setShowCamera] = useState(false); // State for camera modal
    const [successMsg, setSuccessMsg] = useState('');
    const [isSaving, setIsSaving] = useState(false);


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
            setFormData({
                name: data.name,
                department: data.department || '',
                role: data.role
            });
            if (data.profile_picture) {
                setPreview(getImageUrl(data.profile_picture));
            }
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setError('');

        try {
            const token = sessionStorage.getItem('access_token');
            let uploadSuccess = true;

            // 1. Upload Picture if selected
            if (profilePic) {
                const formDataPic = new FormData();
                formDataPic.append('file', profilePic);

                const resPic = await fetch(`${API_BASE}/users/me/picture`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formDataPic
                });

                if (!resPic.ok) {
                    uploadSuccess = false;
                    const errorData = await resPic.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Failed to upload profile picture');
                }
            }

            // 2. Update Text Data (Only if upload succeeded or no upload attempted)
            if (uploadSuccess) {
                const res = await fetch(`${API_BASE}/users/me`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Failed to update profile');
                }

                // Show success feedback logic could go here
                navigate('/profile');
            }
        } catch (err) {
            console.error("Profile Save Error:", err);
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCameraCapture = (file) => {
        setProfilePic(file);
        setPreview(URL.createObjectURL(file));
        setShowCamera(false);
    };


    if (loading) return <div className="flex justify-center items-center h-screen z-10 relative">Loading...</div>;

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

            {/* Back Button */}
            <div className="absolute top-24 left-6 z-20 md:top-28">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <FaArrowLeft /> Cancel
                </button>
            </div>

            <div className="w-full max-w-lg relative z-10 px-4 mt-20 md:mt-0">
                <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Edit Profile</h1>

                <motion.div
                    className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 space-y-6"
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 bg-gray-200">
                            {preview ? (
                                <img src={preview} alt="Profile Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No Image
                                </div>
                            )}
                        </div>

                        {/* Image Upload Buttons */}
                        <div className="flex gap-2">
                            <label className={`cursor-pointer bg-blue-100 text-blue-600 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-blue-200 transition ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                                Upload
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setProfilePic(file);
                                            setPreview(URL.createObjectURL(file));
                                            setError('');
                                        }
                                    }}
                                    disabled={isSaving}
                                />
                            </label>

                            <button
                                onClick={() => setShowCamera(true)}
                                className="cursor-pointer bg-purple-100 text-purple-600 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-purple-200 transition"
                                disabled={isSaving}
                            >
                                Camera
                            </button>
                        </div>
                    </div>

                    {/* Error Message Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm w-full shadow-lg flex items-start gap-3 animate-pulse">
                            <div className="text-xl">⚠️</div>
                            <div className="flex-1">
                                <p className="font-bold text-red-800">Validation Error</p>
                                <p className="text-red-600">{error}</p>
                            </div>
                        </div>
                    )}


                    <div>
                        <label className="block text-gray-700 font-semibold mb-2 ml-1">Full Name</label>
                        <input
                            className="border border-gray-200 bg-white/50 p-3 w-full rounded-xl shadow-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder-gray-400"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your full name"
                            disabled={isSaving}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-semibold mb-2 ml-1">Department</label>
                        <input
                            className="border border-gray-200 bg-white/50 p-3 w-full rounded-xl shadow-sm focus:ring-2 focus:ring-purple-600 outline-none transition-all placeholder-gray-400"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            placeholder="e.g. Engineering, Marketing"
                            disabled={isSaving}
                        />
                    </div>

                    <div className="pt-4 space-y-3">
                        <motion.button
                            whileHover={!isSaving ? { scale: 1.02 } : {}}
                            whileTap={!isSaving ? { scale: 0.98 } : {}}
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`w-full py-3 rounded-xl shadow-lg transition font-semibold flex items-center justify-center gap-2 text-white
                                ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-green-600 hover:shadow-green-500/30'}`}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <FaSave /> Save Changes
                                </>
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={!isSaving ? { scale: 1.02 } : {}}
                            whileTap={!isSaving ? { scale: 0.98 } : {}}
                            onClick={() => navigate('/profile')}
                            disabled={isSaving}
                            className="w-full bg-white/80 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2"
                        >
                            <FaTimes /> Cancel
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Simple Footer */}
            <div className="absolute bottom-4 text-center text-gray-400 text-xs z-10 w-full">
                BragBoard Profile System
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </div>
    );

}
