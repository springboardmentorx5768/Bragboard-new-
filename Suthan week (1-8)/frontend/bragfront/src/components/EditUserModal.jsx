import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUser, FaEnvelope, FaIdCard, FaBuilding, FaUserTag } from 'react-icons/fa';

const EditUserModal = ({ isOpen, onClose, user, onUpdate, departments }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        user_id: '',
        department_id: '',
        role: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                user_id: user.user_id || '',
                department_id: user.department?.id || '',
                role: user.role || 'employee'
            });
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                onUpdate(updatedUser);
                onClose();
            } else {
                const error = await response.json();
                alert(error.detail || "Failed to update user");
            }
        } catch (error) {
            console.error("Error updating user:", error);
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-gray-900 w-full max-w-lg rounded-3xl border border-gray-700 shadow-2xl overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <FaUser />
                        </div>
                        <h2 className="text-xl font-bold text-white">Edit User Profile</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Full Name</label>
                        <div className="relative">
                            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                                placeholder="Enter name"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Email Address</label>
                        <div className="relative">
                            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                                placeholder="Enter email"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* User ID (4-digit) */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Unique ID</label>
                            <div className="relative">
                                <FaIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={formData.user_id}
                                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                                    placeholder="4-digit ID"
                                    maxLength={4}
                                />
                            </div>
                        </div>

                        {/* Role */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Role</label>
                            <div className="relative">
                                <FaUserTag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Department */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Department</label>
                        <div className="relative">
                            <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <select
                                value={formData.department_id}
                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
