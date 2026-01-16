import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import CommentSection from './CommentSection';
import ReactionButton, { ReactionBar } from './ReactionButton';

const ShoutoutDetailModal = ({ shoutout, currentUser, onClose, onReact, onDelete }) => {
    const [isImageZoomed, setIsImageZoomed] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!shoutout || !currentUser) return;

        const shoutoutId = shoutout.shoutId || shoutout.id;
        const isRecipient = shoutout.recipients?.some(r => r.recipient?.id === currentUser.id);
        const isUnviewed = shoutout.recipients?.some(r => r.recipient?.id === currentUser.id && (r.viewed === 'false' || !r.viewed));

        if (isRecipient && isUnviewed) {
            fetch(`/api/shoutouts/${shoutoutId}/mark-viewed`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(() => {
                // Dispatch event to update sidebar count
                window.dispatchEvent(new CustomEvent('shoutoutViewed'));
            }).catch(err => console.error("Failed to mark shoutout as viewed", err));
        }
    }, [shoutout, currentUser, token]);

    if (!shoutout) return null;

    const handleZoomIn = (e) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = (e) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.max(prev - 0.5, 1));
    };

    const toggleImageZoom = () => {
        setIsImageZoomed(!isImageZoomed);
        setZoomLevel(1);
    };

    // Handle both Dashboard format (shoutout.user, shoutout.shoutId) and ReceivedShoutouts format (shoutout.sender, shoutout.id)
    const userName = shoutout.user || shoutout.sender?.name || 'User';
    const userInitial = userName.charAt(0).toUpperCase();
    const displayTime = shoutout.displayTime || (shoutout.created_at ? new Date(shoutout.created_at).toLocaleString() : 'Recently');
    const shoutoutId = shoutout.shoutId || shoutout.id;
    const imageUrl = shoutout.image_url;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            {/* Zoomed Image Overlay */}
            {isImageZoomed && imageUrl && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95"
                    onClick={toggleImageZoom}
                >
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        <img
                            src={imageUrl}
                            alt="Full Size"
                            className="transition-transform duration-200 ease-out cursor-zoom-out"
                            style={{ transform: `scale(${zoomLevel})`, maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }}
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Zoom Controls */}
                        <div className="absolute bottom-10 flex gap-4 bg-black/50 p-2 rounded-full backdrop-blur-sm">
                            <button onClick={handleZoomOut} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                                <FaSearchMinus />
                            </button>
                            <button onClick={handleZoomIn} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                                <FaSearchPlus />
                            </button>
                            <button onClick={toggleImageZoom} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                                <FaTimes />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                >
                    <FaTimes />
                </button>

                {/* Left Side: Content & Image */}
                <div className="md:w-3/5 overflow-y-auto p-0 bg-gray-50 dark:bg-gray-900 custom-scrollbar">
                    <div className="p-6">
                        <div className="flex gap-4 items-center mb-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 bg-gradient-to-br from-indigo-600 to-purple-600">
                                <span className="text-white font-bold text-lg">
                                    {userInitial}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{userName}</h3>
                                <p className="text-sm text-gray-500">{displayTime}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            {shoutout.action && shoutout.item && (
                                <p className="text-gray-900 dark:text-white text-lg leading-relaxed mb-4">
                                    <span className="text-gray-500 mr-1">{shoutout.action}</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{shoutout.item}</span>
                                </p>
                            )}

                            {shoutout.title && <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-2">{shoutout.title}</h2>}
                            <p className="text-gray-800 dark:text-gray-200 text-lg italic mb-4">"{shoutout.message}"</p>

                            {shoutout.tags && (
                                <div className="flex gap-2 flex-wrap mb-4">
                                    {shoutout.tags.split(',').map((tag, i) => (
                                        <span key={i} className="text-sm font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                                            #{tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {imageUrl && (
                                <div className="relative group cursor-zoom-in rounded-2xl overflow-hidden shadow-lg mt-4" onClick={toggleImageZoom}>
                                    <img
                                        src={imageUrl}
                                        alt="Post Attachment"
                                        className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <FaSearchPlus className="text-white opacity-0 group-hover:opacity-100 text-3xl drop-shadow-lg transform scale-50 group-hover:scale-100 transition-all duration-300" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <ReactionBar counts={shoutout.reaction_counts} />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <ReactionButton
                                        shoutoutId={shoutoutId}
                                        userReactions={shoutout.current_user_reactions}
                                        onReact={onReact}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Comments */}
                <div className="md:w-2/5 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-[500px] md:h-auto">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
                        <h3 className="font-bold text-gray-900 dark:text-white">Comments</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <CommentSection shoutoutId={shoutoutId} currentUser={currentUser} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShoutoutDetailModal;
