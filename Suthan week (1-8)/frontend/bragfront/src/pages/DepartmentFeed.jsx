import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBullhorn, FaTrash, FaRegCommentDots, FaExclamationCircle } from 'react-icons/fa';
import ReactionButton, { ReactionBar } from '../components/ReactionButton';
import CommentSection from '../components/CommentSection';
import ShoutoutDetailModal from '../components/ShoutoutDetailModal';
import ReportModal from '../components/ReportModal';

const DepartmentFeed = () => {
    const navigate = useNavigate();
    const [shoutouts, setShoutouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [colleagues, setColleagues] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [filters, setFilters] = useState({ departmentId: '', senderId: '', dateFrom: '', dateTo: '' });
    const [activeComments, setActiveComments] = useState({});
    const [selectedShoutout, setSelectedShoutout] = useState(null);
    const [reportingShoutoutId, setReportingShoutoutId] = useState(null);
    const token = localStorage.getItem('token');

    const toggleComments = (shoutoutId) => {
        setActiveComments(prev => ({
            ...prev,
            [shoutoutId]: !prev[shoutoutId]
        }));
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const headers = { 'Authorization': `Bearer ${token}` };
                const cacheBuster = `?_=${Date.now()}`;

                // Build query string for shoutouts
                let queryParams = new URLSearchParams();
                queryParams.append('_', Date.now());
                if (filters.departmentId) queryParams.append('department_id', filters.departmentId);
                if (filters.senderId) queryParams.append('sender_id', filters.senderId);
                if (filters.dateFrom) queryParams.append('date_from', filters.dateFrom);
                if (filters.dateTo) queryParams.append('date_to', filters.dateTo);

                const [userRes, usersRes, deptRes, shoutRes] = await Promise.all([
                    fetch(`/api/me${cacheBuster}`, { headers }).catch(e => ({ error: e })),
                    fetch(`/api/users${cacheBuster}`, { headers }).catch(e => ({ error: e })),
                    fetch(`/api/departments/${cacheBuster}`, { headers }).catch(e => ({ error: e })),
                    fetch(`/api/shoutouts/?${queryParams.toString()}`, { headers }).catch(e => ({ error: e }))
                ]);

                if (userRes.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }

                const safeJson = async (res) => {
                    if (res && res.ok) {
                        try { return await res.json(); } catch (e) { return null; }
                    }
                    return null;
                };

                const [userData, allUsersData, deptData, shoutData] = await Promise.all([
                    safeJson(userRes),
                    safeJson(usersRes),
                    safeJson(deptRes),
                    safeJson(shoutRes)
                ]);

                if (userData) {
                    setCurrentUserId(userData.id);
                    setCurrentUser(userData);
                }

                if (deptData && Array.isArray(deptData)) {
                    setDepartments(deptData);
                }

                if (allUsersData && Array.isArray(allUsersData)) {
                    const others = userData ? allUsersData.filter(u => u.id !== userData.id) : allUsersData;
                    setColleagues(others);
                }

                const shoutDataList = Array.isArray(shoutData) ? shoutData : [];

                // Map shoutouts to feed items
                const shoutFeed = shoutDataList.map(shout => {
                    let createdDate = null;
                    let dateString = 'Just now';

                    if (shout.created_at) {
                        try {
                            createdDate = new Date(shout.created_at);
                            if (!isNaN(createdDate.getTime())) {
                                dateString = createdDate.toLocaleString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            }
                        } catch (e) {
                            console.error('Error parsing date:', e);
                        }
                    }

                    return {
                        id: shout.id,
                        shoutId: shout.id,
                        type: 'shoutout',
                        senderId: shout.sender_id,
                        user: shout.sender?.name || 'Someone',
                        action: 'sent a post to',
                        item: Array.isArray(shout.recipients) && shout.recipients.length > 0
                            ? shout.recipients.map(r => r.recipient?.name || 'Unknown').join(', ')
                            : 'Someone',
                        message: shout.message,
                        title: shout.title,
                        image_url: shout.image_url,
                        tags: shout.tags,
                        time: createdDate ? createdDate.getTime() : Date.now(),
                        displayTime: dateString,
                        shoutout: shout,
                        reaction_counts: shout.reaction_counts,
                        current_user_reaction: shout.current_user_reaction,
                    };
                });

                const combinedFeed = [...shoutFeed].sort((a, b) => b.time - a.time);
                setShoutouts(combinedFeed);
                setLoading(false);

            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate, filters, token]);

    const handleDeletePost = async (id) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            const res = await fetch(`/api/shoutouts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setShoutouts(prev => prev.filter(s => s.shoutId !== id));
            } else {
                alert("Failed to delete post");
            }
        } catch (error) {
            console.error("Error deleting post", error);
        }
    };

    const handleReaction = async (shoutoutId, type) => {
        try {
            const response = await fetch(`/api/shoutouts/${shoutoutId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type })
            });

            if (response.ok) {
                const updatedShoutout = await response.json();

                // Update specific item in shoutouts
                setShoutouts(prev => prev.map(activity => {
                    if (activity.shoutId === shoutoutId) {
                        return {
                            ...activity,
                            shoutout: { ...activity.shoutout, ...updatedShoutout } // update nested raw object if needed
                        };
                    }
                    return activity;
                }));
                // Actually the mapped object needs update, not just raw shoutout
                setShoutouts(prev => prev.map(activity => {
                    if (activity.shoutId === shoutoutId) {
                        return {
                            ...activity,
                            reaction_counts: updatedShoutout.reaction_counts,
                            current_user_reactions: updatedShoutout.current_user_reactions
                        };
                    }
                    return activity;
                }));
            }
        } catch (error) {
            console.error("Failed to react", error);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-indigo-600 font-bold">Loading Feed...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors hover-glow"
                >
                    <FaArrowLeft />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl text-indigo-600 dark:text-indigo-300">
                        <FaBullhorn />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Feed</h1>
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Department:</label>
                        <select
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover-glow"
                            value={filters.departmentId}
                            onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Sender:</label>
                        <select
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover-glow"
                            value={filters.senderId}
                            onChange={(e) => setFilters({ ...filters, senderId: e.target.value })}
                        >
                            <option value="">All Senders</option>
                            {colleagues.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                            {currentUserId && (
                                <option value={currentUserId}>Me</option>
                            )}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Date:</label>
                        <input
                            type="date"
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover-glow"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover-glow"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        />
                    </div>
                    {(filters.departmentId || filters.senderId || filters.dateFrom || filters.dateTo) && (
                        <button
                            onClick={() => setFilters({ departmentId: '', senderId: '', dateFrom: '', dateTo: '' })}
                            className="text-xs font-bold text-red-500 hover:text-red-600 ml-auto hover-glow"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {shoutouts.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                            <FaBullhorn className="text-4xl mb-4 opacity-50" />
                            <p>No activity yet. Be the first to post!</p>
                        </div>
                    ) : (
                        shoutouts.map((activity, idx) => (
                            <div
                                key={activity.id}
                                className={`p-6 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/30 group relative animate-fade-in-up hover-glow cursor-pointer ${idx < 3 ? `animation-delay-${(idx + 1) * 100}` : ''}`}
                                onClick={() => setSelectedShoutout(activity.shoutout || activity)}
                            >
                                {/* Delete Button for Owner */}
                                {activity.senderId === currentUserId && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeletePost(activity.shoutId); }}
                                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-2 hover-glow"
                                        title="Delete Post"
                                    >
                                        <FaTrash />
                                    </button>
                                )}

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 bg-gradient-to-br from-indigo-600 to-purple-600 transform transition-transform group-hover:scale-110 hover-glow">
                                        <span className="text-white font-bold text-lg">
                                            {activity.user.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-900 dark:text-white pb-1">
                                            <span className="font-bold">{activity.user}</span>
                                            <span className="text-gray-500 dark:text-gray-400 mx-1">{activity.action}</span>
                                            <span className="font-bold text-amber-600 dark:text-amber-500">
                                                {activity.item}
                                            </span>
                                        </p>
                                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 mt-2 space-y-2 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                                            {activity.title && <h4 className="font-bold text-indigo-600 dark:text-indigo-400">{activity.title}</h4>}
                                            <p className="text-gray-700 dark:text-gray-300 italic">"{activity.message}"</p>

                                            {activity.image_url && (
                                                <img src={activity.image_url} alt="Post" className="rounded-lg max-h-60 w-full object-cover shadow-sm hover:scale-105 transition-transform duration-300" />
                                            )}

                                            {activity.tags && (
                                                <div className="flex gap-2 flex-wrap pt-1">
                                                    {activity.tags.split(',').map((tag, i) => (
                                                        <span key={i} className="text-xs font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded hover-glow">
                                                            #{tag.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs font-semibold text-gray-400 mt-2 flex items-center gap-1">
                                            {activity.displayTime}
                                        </p>
                                        {/* Footer / Actions */}
                                        <div className="mt-4">
                                            <ReactionBar counts={activity.reaction_counts} />

                                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-stretch justify-between">
                                                <div className="flex-1">
                                                    <ReactionButton
                                                        shoutoutId={activity.shoutId}
                                                        userReactions={activity.current_user_reactions}
                                                        onReact={handleReaction}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleComments(activity.shoutId); }}
                                                        className="w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
                                                    >
                                                        <FaRegCommentDots className="text-xl" />
                                                        <span className="hidden sm:inline">Comment</span>
                                                    </button>
                                                </div>
                                                <div className="flex-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setReportingShoutoutId(activity.shoutId); }}
                                                        className="w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                        title="Report this post"
                                                    >
                                                        <FaExclamationCircle className="text-lg" />
                                                        <span className="hidden sm:inline">Report</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {activeComments[activity.shoutId] && (
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <CommentSection shoutoutId={activity.shoutId} currentUser={currentUser} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {selectedShoutout && (
                <ShoutoutDetailModal
                    shoutout={selectedShoutout}
                    currentUser={currentUser}
                    onClose={() => setSelectedShoutout(null)}
                    onReact={handleReaction}
                    onDelete={handleDeletePost}
                />
            )}
            {reportingShoutoutId && (
                <ReportModal
                    shoutoutId={reportingShoutoutId}
                    onClose={() => setReportingShoutoutId(null)}
                />
            )}
        </div>
    );
};

export default DepartmentFeed;
