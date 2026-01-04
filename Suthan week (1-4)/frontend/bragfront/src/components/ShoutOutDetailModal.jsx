import React from 'react';
import { FaTimes, FaHeart, FaCalendar, FaUser } from 'react-icons/fa';

const ShoutOutDetailModal = ({ shoutout, onClose, onViewed }) => {
    const token = localStorage.getItem('token');

    React.useEffect(() => {
        // Mark as viewed when modal opens
        const markViewed = async () => {
            if (!shoutout || !token) return;
            
            try {
                const response = await fetch(`/api/shoutouts/${shoutout.id}/mark-viewed`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok || response.status === 204) {
                    if (onViewed) {
                        onViewed(shoutout.id);
                    }
                }
            } catch (error) {
                console.error("Failed to mark shout-out as viewed", error);
            }
        };
        
        if (shoutout?.id) {
            markViewed();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shoutout?.id]);

    if (!shoutout) return null;

    const dateString = shoutout.created_at 
        ? new Date(shoutout.created_at).toLocaleString([], { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        }) 
        : 'Recently';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-pink-500 to-purple-600">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <FaHeart className="text-white text-xl" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Shout-Out Details</h2>
                            <p className="text-sm text-pink-100">Appreciation from your team</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <FaTimes className="text-white text-lg" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Sender Info */}
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${shoutout.sender?.id || 'default'}`}
                                alt={shoutout.sender?.name || 'User'}
                                className="w-16 h-16 rounded-full ring-4 ring-pink-500/20"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-1.5">
                                <FaUser className="text-white text-xs" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {shoutout.sender?.name || 'Someone'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {shoutout.sender?.department?.name || 'Team Member'}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                <FaCalendar />
                                <span>{dateString}</span>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    {shoutout.title && (
                        <div className="animate-fade-in-up">
                            <h4 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                {shoutout.title}
                            </h4>
                        </div>
                    )}

                    {/* Message */}
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-pink-200/50 dark:border-pink-700/50 animate-fade-in-up animation-delay-100">
                        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed italic">
                            "{shoutout.message}"
                        </p>
                    </div>

                    {/* Image */}
                    {shoutout.image_url && (
                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in-up animation-delay-200">
                            <img 
                                src={shoutout.image_url} 
                                alt="Post attachment" 
                                className="w-full max-h-96 object-cover hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    )}

                    {/* Tags */}
                    {shoutout.tags && (
                        <div className="flex gap-2 flex-wrap animate-fade-in-up animation-delay-300">
                            {shoutout.tags.split(',').map((tag, i) => (
                                <span 
                                    key={i} 
                                    className="text-sm font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                >
                                    #{tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Recipients */}
                    {shoutout.recipients && shoutout.recipients.length > 0 && (
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 animate-fade-in-up animation-delay-400">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                Also appreciated:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {shoutout.recipients.map((rec, i) => (
                                    <span 
                                        key={i}
                                        className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300"
                                    >
                                        {rec.recipient.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 flex items-center justify-center gap-2">
                    <FaHeart className="text-pink-500 animate-pulse" />
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        You were appreciated!
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ShoutOutDetailModal;

