import React, { useState, useEffect, useRef } from 'react';
import { FaBullhorn, FaTimes, FaUserCircle, FaImage, FaTag } from 'react-icons/fa';
import Confetti from 'react-confetti';

const CreatePostModal = ({ onClose, onPostCreated, colleagues, departments = [] }) => {
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [recycleConfetti, setRecycleConfetti] = useState(true);
    const fileInputRef = useRef(null);
    const token = localStorage.getItem('token');

    // Handle image upload and conversion to Base64
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const filteredColleagues = colleagues.filter(col => {
        const matchesSearch = col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            col.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            col.user_id?.includes(searchTerm);
        const matchesDepartment = !departmentFilter || col.department?.id?.toString() === departmentFilter;
        const notSelected = !selectedRecipients.find(r => r.id === col.id);
        return matchesSearch && matchesDepartment && notSelected;
    });

    useEffect(() => {
        if (showConfetti) {
            // Stop generating new confetti after 8 seconds
            const timer = setTimeout(() => {
                setRecycleConfetti(false);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [showConfetti]);

    // Double click to stop confetti immediately
    const handleDoubleClk = () => {
        setShowConfetti(false);
    };

    // ... (rest of logic) ...

    const handleAddRecipient = (user) => {
        setSelectedRecipients([...selectedRecipients, user]);
        setSearchTerm('');
        setShowSuggestions(false);
    };

    const handleRemoveRecipient = (userId) => {
        setSelectedRecipients(selectedRecipients.filter(r => r.id !== userId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedRecipients.length === 0) {
            alert("Please tag at least one team member to recognize!");
            return;
        }

        setIsSubmitting(true);
        try {
            // ... (payload creation) ...
            const payload = {
                message,
                title,
                tags,
                image_url: imagePreview,
                recipient_ids: selectedRecipients.map(r => r.id)
            };

            const response = await fetch('/api/shoutouts/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Clear form
                setMessage('');
                setTitle('');
                setTags('');
                setImagePreview(null);
                setSelectedRecipients([]);

                setShowSuccess(true);
                setShowConfetti(true);
                setRecycleConfetti(true); // Start recycling

                // Refresh feed after a short delay to ensure database commit is complete
                if (onPostCreated) {
                    setTimeout(() => {
                        onPostCreated();
                    }, 500); // Small delay to ensure backend has committed
                }

                // Close modal after showing success animation
                setTimeout(() => {
                    onClose();
                }, 3000); // Close modal after 3 seconds
            } else {
                let errorMsg = "Something went wrong";
                try {
                    const errorText = await response.text();
                    try {
                        const error = JSON.parse(errorText);
                        errorMsg = error.detail || error.message || errorText;
                    } catch (e) {
                        errorMsg = errorText || `Server error ${response.status}`;
                    }
                } catch (e) {
                    errorMsg = `Server error ${response.status}`;
                }
                alert(`Error: ${errorMsg}`);
            }
        } catch (error) {
            console.error("Post Error:", error);
            alert("Network error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onDoubleClick={handleDoubleClk}
        >
            {showConfetti && (
                <Confetti
                    numberOfPieces={400}
                    recycle={recycleConfetti}
                    gravity={0.15}
                />
            )}

            <div className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FaBullhorn className="text-indigo-600 dark:text-indigo-400" />
                            Create New Post
                        </h2>
                        <p className="text-sm text-gray-500">Share updates and recognize your team</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <FaTimes className="text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Form Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {showSuccess ? (
                        <div className="text-center py-10">
                            <h3 className="text-3xl font-bold text-green-500 mb-2">Success!</h3>
                            <p className="text-gray-600 dark:text-gray-300">Your post has been shared.</p>
                        </div>
                    ) : (
                        <form id="postForm" onSubmit={handleSubmit} className="space-y-5">
                            {/* Recipients (Tagging) */}
                            <div className="relative z-20">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Recipients / Team Members
                                    </label>
                                    {departments.length > 0 && (
                                        <select
                                            value={departmentFilter}
                                            onChange={(e) => setDepartmentFilter(e.target.value)}
                                            className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover-glow"
                                        >
                                            <option value="">All Departments</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id.toString()}>{dept.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2 p-2 border border-gray-200 dark:border-gray-600 rounded-xl min-h-[46px]">
                                    {selectedRecipients.map(r => (
                                        <span key={r.id} className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold hover-glow">
                                            {r.name} {r.user_id && <span className="text-indigo-900 dark:text-indigo-200">#{r.user_id}</span>}
                                            <button type="button" onClick={() => handleRemoveRecipient(r.id)} className="hover:text-indigo-900 dark:hover:text-white hover-glow">
                                                <FaTimes />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="Type name, email, or ID to tag..."
                                        className="flex-1 bg-transparent outline-none min-w-[150px] text-gray-900 dark:text-white"
                                        value={searchTerm}
                                        onFocus={() => setShowSuggestions(true)}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {showSuggestions && (searchTerm || filteredColleagues.length > 0) && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto">
                                        {filteredColleagues.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500 text-sm">No colleagues found</div>
                                        ) : (
                                            filteredColleagues.map(col => (
                                                <div
                                                    key={col.id}
                                                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3 hover-glow transition-all"
                                                    onClick={() => handleAddRecipient(col)}
                                                >
                                                    <FaUserCircle className="text-gray-400 text-xl" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{col.name} {col.user_id && <span className="text-indigo-600 dark:text-indigo-400">#{col.user_id}</span>}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {col.department?.name ? `${col.department.name} • ` : ''}{col.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Title / Subject
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter a catchy title..."
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            {/* Description/Message */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    required
                                    placeholder="What's this post about?"
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] resize-none"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                ></textarea>
                            </div>

                            {/* Photo Upload & Tags */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Photo */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Photo (Optional)
                                    </label>
                                    <div
                                        onClick={() => fileInputRef.current.click()}
                                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        {imagePreview ? (
                                            <div className="relative h-32 w-full">
                                                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="py-4">
                                                <FaImage className="mx-auto text-3xl text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-500">Click to upload image</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Tags
                                    </label>
                                    <div className="relative">
                                        <FaTag className="absolute top-3.5 left-3 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="e.g. #win, #project"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                        />
                                    </div>
                                    {/* Tag Suggestions */}
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {['#Teamwork', '#Innovation', '#Hero', '#Kudos', '#GreatJob', '#Leadership'].map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => setTags(prev => prev ? `${prev}, ${tag}` : tag)}
                                                className="text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Actions */}
                {!showSuccess && (
                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                const form = document.getElementById('postForm');
                                if (form) form.requestSubmit();
                            }}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Posting...' : 'Create Post'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreatePostModal;
