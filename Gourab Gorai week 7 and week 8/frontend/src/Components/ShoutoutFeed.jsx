import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserCircle, FaSpinner, FaCommentAlt, FaRegCommentAlt, FaFlag, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import ReactionButton from './ReactionButton';
import CommentSection from './CommentSection';
import ReportModal from './ReportModal';
import ImageModal from './ImageModal';

import API_BASE from "../config";
import { getImageUrl } from '../utils/imageUtils';

const ShoutoutFeed = ({ refreshTrigger, userId }) => {
    const [shoutouts, setShoutouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [department, setDepartment] = useState(''); // Filter state
    const [departmentsList, setDepartmentsList] = useState([]); // Dynamic departments
    const [activeCommentId, setActiveCommentId] = useState(null); // Which post has comments open
    const [reportModal, setReportModal] = useState({ isOpen: false, shoutoutId: null });
    const [editingShoutoutId, setEditingShoutoutId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [settings, setSettings] = useState({ allow_comments: 'true', allow_reactions: 'true' });

    const openReportModal = (id) => setReportModal({ isOpen: true, shoutoutId: id });
    const closeReportModal = () => setReportModal({ isOpen: false, shoutoutId: null });

    const handleReportSubmit = async (reason) => {
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/reports/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    reason,
                    shoutout_id: reportModal.shoutoutId
                })
            });
            if (res.ok) {
                alert('Report submitted successfully.');
            } else {
                alert('Failed to submit report.');
            }
        } catch (e) {
            console.error(e);
            alert('Error submitting report.');
        }
        closeReportModal();
    };

    // Fetch current user and departments on mount
    useEffect(() => {
        const fetchUserData = async () => {
            const token = sessionStorage.getItem('access_token');
            if (!token) return;
            try {
                // Fetch User
                const resUser = await fetch(`${API_BASE}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resUser.ok) setCurrentUser(await resUser.json());

                // Fetch Departments
                const resDept = await fetch(`${API_BASE}/users/departments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resDept.ok) {
                    setDepartmentsList(await resDept.json());
                }

                // Fetch Settings
                const resSettings = await fetch(`${API_BASE}/shoutouts/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resSettings.ok) {
                    setSettings(await resSettings.json());
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchUserData();
    }, []);

    const fetchShoutouts = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = sessionStorage.getItem('access_token');
            // Construct URL with optional department filter or user filter
            let url = `${API_BASE}/shoutouts/?`;
            if (userId) {
                url += `user_id=${userId}`;
            } else if (department) {
                url += `department=${encodeURIComponent(department)}`;
            }

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}` // Now required for feed visibility
                }
            });

            if (!res.ok) throw new Error('Failed to fetch shoutouts');

            const data = await res.json();
            setShoutouts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShoutouts();
    }, [refreshTrigger, department, userId]); // Re-fetch when triggers change

    const handleReact = async (shoutoutId, type) => {
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/shoutouts/${shoutoutId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type })
            });

            if (res.ok) {
                fetchShoutouts(); // Refresh to show updated counts/state
            }
        } catch (e) { console.error(e); }
    };

    const handleAddComment = async (shoutoutId, content) => {
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/shoutouts/${shoutoutId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            if (res.ok) {
                fetchShoutouts(); // Refresh to show new comment
            }
        } catch (e) { console.error(e); }
    };

    const toggleComments = (id) => {
        setActiveCommentId(activeCommentId === id ? null : id);
    };

    const startEditing = (shoutout) => {
        setEditingShoutoutId(shoutout.id);
        setEditContent(shoutout.message);
    };

    const cancelEditing = () => {
        setEditingShoutoutId(null);
        setEditContent('');
    };

    const saveEdit = async (shoutoutId) => {
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/shoutouts/${shoutoutId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: editContent })
            });

            if (res.ok) {
                fetchShoutouts(); // Refresh to show updated content
                setEditingShoutoutId(null);
                setEditContent('');
            } else {
                alert('Failed to update shoutout');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating shoutout');
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar - Hide if userId is provided */}
            {!userId && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {['', ...departmentsList].map((dept) => (
                        <button
                            key={dept}
                            onClick={() => setDepartment(dept)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${department === dept
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {dept || 'All Departments'}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-10">
                    <FaSpinner className="animate-spin text-blue-500 text-3xl" />
                </div>
            ) : error ? (
                <div className="text-center text-red-500 py-10 bg-red-50 rounded-xl">
                    {error}
                </div>
            ) : shoutouts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100"
                >
                    <p className="text-gray-400 text-lg">No shoutouts yet. Be the first!</p>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    {shoutouts.map((shoutout) => (
                        <div
                            key={shoutout.id}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md"
                        >
                            <div className="flex items-center mb-4">
                                <div className="mr-3 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden border border-gray-200">
                                    {shoutout.sender.profile_picture ? (
                                        <img src={getImageUrl(shoutout.sender.profile_picture)} alt={shoutout.sender.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <FaUserCircle className="text-gray-400 text-3xl" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {shoutout.sender.name}
                                        {shoutout.sender.is_deleted === 'true' && <span className="text-gray-400 text-xs font-normal ml-2 italic">(Deleted Profile)</span>}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        to{' '}
                                        {shoutout.recipients && shoutout.recipients.length > 0 ? (
                                            shoutout.recipients.map((r, index) => (
                                                <span key={r.recipient.id}>
                                                    <span className="font-medium text-blue-600">{r.recipient.name}</span>
                                                    {index < shoutout.recipients.length - 1 && ', '}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="italic text-gray-400">Everyone</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {editingShoutoutId === shoutout.id ? (
                                <div className="mb-4">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                        rows="3"
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            onClick={cancelEditing}
                                            className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                        >
                                            <FaTimes className="mr-1" /> Cancel
                                        </button>
                                        <button
                                            onClick={() => saveEdit(shoutout.id)}
                                            className="flex items-center px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                        >
                                            <FaSave className="mr-1" /> Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-700 mb-4 leading-relaxed">{shoutout.message}</p>
                            )}

                            {/* Media Attachments */}
                            {shoutout.media && shoutout.media.length > 0 && (
                                <div className={`grid gap-2 mb-4 ${shoutout.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    {shoutout.media.map(media => (
                                        <div key={media.id} className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                            {media.media_type === 'image' ? (
                                                <img
                                                    src={getImageUrl(media.file_path)}
                                                    alt="Attachment"
                                                    className="w-full h-full object-cover max-h-96 cursor-pointer hover:opacity-95 transition-opacity"
                                                    loading="lazy"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImage(getImageUrl(media.file_path));
                                                    }}
                                                />
                                            ) : (
                                                <video
                                                    src={getImageUrl(media.file_path)}
                                                    controls
                                                    className="w-full h-full object-cover max-h-96"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between text-gray-500 text-sm">
                                {/* ReactionButton handles all reaction types internally */}
                                <ReactionButton
                                    shoutoutId={shoutout.id}
                                    reactions={shoutout.reactions || []}
                                    currentUserId={currentUser?.id}
                                    onReact={handleReact}
                                    disabled={settings.allow_reactions !== 'true'}
                                />

                                <button
                                    onClick={() => toggleComments(shoutout.id)}
                                    className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                                >
                                    {activeCommentId === shoutout.id ? <FaCommentAlt /> : <FaRegCommentAlt />}
                                    <span>{shoutout.comments?.length || 0} Comments</span>
                                </button>

                                <button
                                    onClick={() => openReportModal(shoutout.id)}
                                    className="flex items-center space-x-1 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Report"
                                >
                                    <FaFlag />
                                </button>

                                {currentUser?.id === shoutout.sender.id && (
                                    <button
                                        onClick={() => startEditing(shoutout)}
                                        className="flex items-center space-x-1 text-gray-400 hover:text-green-600 transition-colors"
                                        title="Edit"
                                        disabled={editingShoutoutId === shoutout.id}
                                    >
                                        <FaEdit />
                                    </button>
                                )}
                            </div>
                            {activeCommentId === shoutout.id && (
                                <div className="mt-4">
                                    <CommentSection
                                        shoutoutId={shoutout.id}
                                        comments={shoutout.comments || []}
                                        onAddComment={handleAddComment}
                                        currentUser={currentUser}
                                        disabled={settings.allow_comments !== 'true'}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <ReportModal
                isOpen={reportModal.isOpen}
                onClose={closeReportModal}
                onSubmit={handleReportSubmit}
                title="Report Shoutout"
            />

            <ImageModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageSrc={selectedImage}
            />
        </div>
    );
};

export default ShoutoutFeed;
