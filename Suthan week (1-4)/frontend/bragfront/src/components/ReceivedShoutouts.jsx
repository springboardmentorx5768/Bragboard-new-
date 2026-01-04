import React, { useState, useEffect } from 'react';
import { FaBullhorn, FaHeart } from 'react-icons/fa';
import ShoutOutDetailModal from './ShoutOutDetailModal';

const ReceivedShoutouts = () => {
    const [receivedShoutouts, setReceivedShoutouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShoutout, setSelectedShoutout] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const token = localStorage.getItem('token');

    const fetchReceivedShoutouts = async () => {
        try {
            const cacheBuster = `?_=${Date.now()}`;
            const response = await fetch(`/api/shoutouts/received${cacheBuster}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setReceivedShoutouts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch received shoutouts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch current user ID
        const fetchCurrentUser = async () => {
            try {
                const response = await fetch('/api/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const userData = await response.json();
                    setCurrentUserId(userData.id);
                }
            } catch (error) {
                console.error("Failed to fetch current user", error);
            }
        };
        
        fetchCurrentUser();
        fetchReceivedShoutouts();
    }, []);

    const handleShoutoutViewed = (shoutoutId) => {
        // Refresh the list to update counts
        fetchReceivedShoutouts();
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (receivedShoutouts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                        <FaBullhorn className="text-xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shout-Outs for You</h2>
                        <p className="text-sm text-gray-500">Appreciation from your team</p>
                    </div>
                </div>
                <p className="text-gray-500 text-center py-8 italic">No shout-outs yet. Keep up the great work!</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                            <FaBullhorn className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shout-Outs for You</h2>
                            <p className="text-sm text-gray-500">{receivedShoutouts.length} appreciation{receivedShoutouts.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
                {receivedShoutouts.map((shoutout, idx) => {
                    // Check if the current user's recipient entry is unviewed
                    const currentUserRecipient = shoutout.recipients?.find(rec => 
                        rec.recipient?.id === currentUserId
                    );
                    const isUnviewed = currentUserRecipient && (currentUserRecipient.viewed === 'false' || !currentUserRecipient.viewed || currentUserRecipient.viewed === null);
                    
                    return (
                        <div
                            key={shoutout.id}
                            onClick={() => setSelectedShoutout(shoutout)}
                            className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer group hover-lift animate-fade-in-up ${idx < 3 ? `animation-delay-${(idx + 1) * 100}` : ''} ${isUnviewed ? 'bg-pink-50/50 dark:bg-pink-900/10 border-l-4 border-pink-500' : ''}`}
                        >
                        <div className="flex gap-4">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${shoutout.sender?.id || 'default'}`}
                                    alt={shoutout.sender?.name || 'User'}
                                    className="w-12 h-12 rounded-full ring-2 ring-pink-500/20 group-hover:ring-pink-500/40 transition-all"
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {shoutout.sender?.name || 'Someone'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {shoutout.sender?.department?.name || 'Team Member'}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {shoutout.created_at ? new Date(shoutout.created_at).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                    </span>
                                </div>

                                {/* Title */}
                                {shoutout.title && (
                                    <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2 text-lg">
                                        {shoutout.title}
                                    </h4>
                                )}

                                {/* Message */}
                                <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-pink-200/50 dark:border-pink-700/50 mb-3">
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        "{shoutout.message}"
                                    </p>
                                </div>

                                {/* Image */}
                                {shoutout.image_url && (
                                    <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                        <img 
                                            src={shoutout.image_url} 
                                            alt="Post attachment" 
                                            className="w-full max-h-96 object-cover"
                                        />
                                    </div>
                                )}

                                {/* Tags */}
                                {shoutout.tags && (
                                    <div className="flex gap-2 flex-wrap mb-3">
                                        {shoutout.tags.split(',').map((tag, i) => (
                                            <span key={i} className="text-xs font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded">
                                                #{tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2">
                                        <FaHeart className="text-pink-500 text-sm animate-pulse" />
                                        <span className="text-xs text-gray-500 italic">
                                            You were appreciated!
                                        </span>
                                    </div>
                                    {isUnviewed && (
                                        <span className="text-xs bg-pink-500 text-white px-2 py-1 rounded-full font-bold animate-glow-pulse">
                                            New
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
            
            {/* Detail Modal */}
            {selectedShoutout && (
                <ShoutOutDetailModal
                    shoutout={selectedShoutout}
                    onClose={() => setSelectedShoutout(null)}
                    onViewed={handleShoutoutViewed}
                />
            )}
        </div>
    );
};

export default ReceivedShoutouts;
