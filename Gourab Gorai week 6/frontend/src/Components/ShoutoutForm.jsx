import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaUserFriends, FaSearch, FaPaperclip, FaImage, FaTrash, FaTimes } from 'react-icons/fa';

import API_BASE from "../config";

const ShoutoutForm = ({ onShoutoutPosted }) => {
    const [message, setMessage] = useState('');
    const [recipients, setRecipients] = useState([]); // All available users
    const [selectedRecipients, setSelectedRecipients] = useState([]); // IDs of selected users
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('access_token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch current user and all users in parallel
                const [userRes, usersRes] = await Promise.all([
                    fetch(`${API_BASE}/users/me`, { headers }),
                    fetch(`${API_BASE}/users/`, { headers })
                ]);

                if (userRes.ok && usersRes.ok) {
                    const currentUser = await userRes.json();
                    const allUsers = await usersRes.json();
                    // Filter out the current user
                    setRecipients(allUsers.filter(u => u.id !== currentUser.id));
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message || selectedRecipients.length === 0) return;

        setLoading(true);
        try {
            const token = sessionStorage.getItem('access_token');
            const formData = new FormData();
            formData.append('message', message);
            selectedRecipients.forEach(id => formData.append('recipient_ids', id));
            files.forEach(file => formData.append('files', file));

            const res = await fetch(`${API_BASE}/shoutouts/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                setMessage('');
                setSelectedRecipients([]);
                setFiles([]);
                if (onShoutoutPosted) onShoutoutPosted();
            }
        } catch (err) {
            console.error("Failed to post shoutout", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleRecipient = (userId) => {
        if (selectedRecipients.includes(userId)) {
            setSelectedRecipients(prev => prev.filter(id => id !== userId));
        } else {
            setSelectedRecipients(prev => [...prev, userId]);
        }
    };

    const filteredRecipients = recipients.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl mb-8 w-full"
        >
            <div className="flex items-center gap-3 mb-4 text-gray-800">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <FaPaperPlane />
                </div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Give a Shoutout!
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Recipient Selection */}
                <div className="relative">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-600">
                        <FaUserFriends />
                        <span>Who do you want to recognize?</span>
                    </div>

                    {/* Search Input */}
                    <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                        <FaSearch className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search colleagues..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
                        />
                    </div>

                    {/* User List (Scrollable) */}
                    <div className="max-h-32 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50 space-y-1 custom-scrollbar">
                        {filteredRecipients.map(user => (
                            <div
                                key={user.id}
                                onClick={() => toggleRecipient(user.id)}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedRecipients.includes(user.id)
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'hover:bg-white text-gray-600 border border-transparent'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedRecipients.includes(user.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'
                                    }`}>
                                    {selectedRecipients.includes(user.id) && <motion.div layoutId="check" className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <span className="text-sm font-medium">{user.name}</span>
                                <span className="text-xs text-gray-400 ml-auto">{user.department || 'General'}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{selectedRecipients.length} selected</p>
                </div>

                {/* Message Input */}
                <div>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="What did they do that was awesome?"
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none h-24 text-gray-700 placeholder-gray-400"
                    />
                </div>

                {/* File Attachments */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <FaPaperclip /> Attach Photo/Video
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            accept="image/*,video/*"
                            className="hidden"
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <AnimatePresence>
                            {files.map((file, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group"
                                >
                                    {file.type.startsWith('video/') ? (
                                        <video
                                            src={URL.createObjectURL(file)}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading || !message || selectedRecipients.length === 0}
                        type="submit"
                        className={`px-6 py-2 rounded-xl font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all ${loading || !message || selectedRecipients.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-blue-500/40'
                            }`}
                    >
                        {loading ? 'Posting...' : 'Post Shoutout'}
                        {!loading && <FaPaperPlane size={14} />}
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default ShoutoutForm;
