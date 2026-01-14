import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaBuilding, FaUserTie, FaCalendarAlt, FaTrash, FaPencilAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://localhost:8000";

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [showImage, setShowImage] = useState(false);

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

    const handleDelete = async () => {
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
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.995 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
    };

    if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;
    if (!user) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
            style={{ backgroundImage: "url('/200.jpg')" }}
        >
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-between mb-10">
                    <div className="w-10"></div> {/* Spacer for centering */}
                    <h1 className="text-4xl font-bold text-gray-100">My Profile</h1>
                    <button
                        onClick={handleDelete}
                        className="group flex items-center gap-2 transition p-2 font-semibold"
                        title="Delete Account"
                    >
                        <span className="text-gray-200 group-hover:text-red-700 transition">Delete Account</span>
                        <FaTrash size={20} className="text-green-700 group-hover:text-red-700 transition" />
                    </button>
                </div>

                <motion.div
                    className="bg-white p-8 rounded-2xl shadow-xl space-y-6 border border-gray-100 flex flex-col items-start"
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                >
                    <div className="flex mb-2 relative group w-32 h-32 self-center">
                        {user.profile_image_url ? (
                            <img
                                src={`http://localhost:8000${user.profile_image_url}`}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover shadow-lg border-4 border-green-900 cursor-zoom-in"
                                onClick={() => setShowImage(true)}
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center border-4 border-green-900 shadow-lg">
                                <FaUser size={48} className="text-gray-400" />
                            </div>
                        )}
                        {/* Pencil Icon Overlay */}
                        <div
                            className="absolute top-0 right-0 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-gray-100 transition border border-gray-200"
                            onClick={() => document.getElementById('fileInput').click()}
                            title="Change Profile Picture"
                        >
                            <FaPencilAlt className="text-gray-600 text-xs" />
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
                                        // window.location.reload();
                                    } else {
                                        alert("Failed to upload image");
                                    }
                                } catch (err) {
                                    console.error("Upload error", err);
                                }
                            }}
                        />
                    </div>

                    <div className="w-full space-y-4">
                        <div className="grid grid-cols-[30px_1fr] items-center gap-2">
                            <FaUser className="text-blue-600 text-lg" />
                            <p className="text-lg"><b>Name:</b> {user.name}</p>
                        </div>

                        <div className="grid grid-cols-[30px_1fr] items-center gap-2">
                            <FaEnvelope className="text-red-500 text-lg" />
                            <p className="text-lg"><b>Email:</b> {user.email}</p>
                        </div>

                        <div className="grid grid-cols-[30px_1fr] items-center gap-2">
                            <FaBuilding className="text-purple-600 text-lg" />
                            <p className="text-lg"><b>Department:</b> {user.department || 'Not Set'}</p>
                        </div>

                        <div className="grid grid-cols-[30px_1fr] items-center gap-2">
                            <FaUserTie className="text-green-600 text-lg" />
                            <p className="text-lg"><b>Role:</b> <span className="capitalize">{user.role}</span></p>
                        </div>

                        <div className="grid grid-cols-[30px_1fr] items-center gap-2">
                            <FaCalendarAlt className="text-orange-500 text-lg" />
                            <p className="text-lg"><b>Joined On:</b> {new Date(user.joined_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </motion.div>



                <div className="mt-10 space-y-4 text-center">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/profile/edit')}
                        className="w-full max-w-xs mx-auto bg-green-800 text-white py-3 rounded-xl shadow hover:bg-green-700 transition font-semibold"
                    >
                        Edit Profile
                    </motion.button>
                </div>

            </div >

            {/* Image View Modal */}
            < AnimatePresence >
                {showImage && user.profile_image_url && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out shadow-2xl"
                        onClick={() => setShowImage(false)}
                    >
                        <motion.img
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            src={`http://localhost:8000${user.profile_image_url}`}
                            alt="Full Profile"
                            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl border-4 border-white/20"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            className="absolute top-6 right-6 text-white text-4xl font-light hover:text-gray-300 transition"
                            onClick={() => setShowImage(false)}
                        >
                            &times;
                        </button>
                    </motion.div>
                )
                }
            </AnimatePresence >
        </div >
    );
}