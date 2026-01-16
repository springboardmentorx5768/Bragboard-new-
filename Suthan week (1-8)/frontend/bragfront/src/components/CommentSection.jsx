import React, { useState, useEffect } from 'react';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

const CommentSection = ({ shoutoutId, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const token = localStorage.getItem('token');

    const formatTimeAgo = (date) => {
        if (!date) return 'Just now';

        // Ensure we handle ISO strings and actual Date objects
        const parsedDate = date instanceof Date ? date : new Date(date);

        if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2000) return 'Just now';

        const now = new Date();
        const seconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);

        // Handle negative diff (server clock slightly ahead of client)
        if (seconds < 30) return 'Just now';
        if (seconds < 60) return `${seconds} seconds ago`;

        let interval = Math.floor(seconds / 60);
        if (interval < 60) return `${interval} ${interval === 1 ? 'minute' : 'minutes'} ago`;

        interval = Math.floor(seconds / 3600);
        if (interval < 24) return `${interval} ${interval === 1 ? 'hour' : 'hours'} ago`;

        interval = Math.floor(seconds / 86400);
        if (interval < 7) return `${interval} ${interval === 1 ? 'day' : 'days'} ago`;

        return parsedDate.toLocaleDateString();
    };

    const fetchComments = async () => {
        try {
            const response = await fetch(`/api/shoutouts/${shoutoutId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    useEffect(() => {
        if (shoutoutId) fetchComments();
    }, [shoutoutId]);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || loading) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/shoutouts/${shoutoutId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    shoutout_id: shoutoutId,
                    content: newComment.trim(),
                    parent_id: replyTo?.id || null
                })
            });

            if (response.ok) {
                setNewComment('');
                setReplyTo(null);
                fetchComments();
            }
        } catch (error) {
            console.error('Failed to post comment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        try {
            const response = await fetch(`/api/shoutouts/${shoutoutId}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchComments();
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleCommentReaction = async (commentId, type) => {
        try {
            const response = await fetch(`/api/shoutouts/${shoutoutId}/comments/${commentId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type })
            });

            if (response.ok) {
                const updatedComment = await response.json();
                setComments(prev => {
                    const updateRecursive = (list) => list.map(c => {
                        if (c.id === commentId) {
                            return { ...c, ...updatedComment };
                        }
                        if (c.replies) {
                            return { ...c, replies: updateRecursive(c.replies) };
                        }
                        return c;
                    });
                    return updateRecursive(prev);
                });
            }
        } catch (error) {
            console.error('Failed to react to comment:', error);
        }
    };

    const renderComment = (comment, isReply = false) => {
        const hasLiked = comment.current_user_reaction === 'like';
        const hasDisliked = comment.current_user_reaction === 'dislike';
        const likeCount = comment.reaction_counts?.like || 0;
        const dislikeCount = comment.reaction_counts?.dislike || 0;

        return (
            <div key={comment.id} className={`group flex gap-2 ${isReply ? 'ml-12 mt-2' : 'mb-4'}`}>
                <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.id || 'default'}`}
                    alt={comment.user?.name || 'User'}
                    className="w-8 h-8 rounded-full flex-shrink-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 inline-block max-w-full">
                        <div className="font-semibold text-gray-900 dark:text-white text-xs">
                            {comment.user?.name || 'Anonymous'}
                        </div>
                        <p className="text-gray-900 dark:text-gray-200 text-sm break-words">
                            {comment.content}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <FaThumbsUp
                                onClick={() => handleCommentReaction(comment.id, 'like')}
                                className={`cursor-pointer transition-all ${hasLiked ? 'text-blue-600 scale-110' : 'hover:text-blue-500'}`}
                            />
                            {likeCount > 0 && <span>{likeCount}</span>}
                        </div>
                        <div className="flex items-center gap-1">
                            <FaThumbsDown
                                onClick={() => handleCommentReaction(comment.id, 'dislike')}
                                className={`cursor-pointer transition-all ${hasDisliked ? 'text-red-600 scale-110' : 'hover:text-red-500'}`}
                            />
                            {dislikeCount > 0 && <span>{dislikeCount}</span>}
                        </div>
                        {!isReply && (
                            <span onClick={() => setReplyTo(comment)} className="cursor-pointer font-semibold hover:underline">Reply</span>
                        )}
                        {(currentUser?.id === comment.user_id || currentUser?.role === 'admin') && (
                            <span onClick={() => handleDeleteComment(comment.id)} className="text-red-600 cursor-pointer font-semibold hover:underline">Delete</span>
                        )}
                        <span className="text-[10px] opacity-70">{formatTimeAgo(comment.created_at)}</span>
                    </div>

                    {replyTo?.id === comment.id && (
                        <div className="mt-2 flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 text-sm outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(e)}
                            />
                            <button onClick={() => { setReplyTo(null); setNewComment(''); }} className="text-xs text-gray-500">Cancel</button>
                        </div>
                    )}

                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2 space-y-2">
                            {comment.replies.map(reply => renderComment(reply, true))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                {comments.map(c => renderComment(c))}
            </div>
            <form onSubmit={handleSubmitComment} className="mt-4 flex gap-2 items-center">
                <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id || 'default'}`}
                    alt="You"
                    className="w-8 h-8 rounded-full"
                />
                <input
                    type="text"
                    value={replyTo ? '' : newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyTo ? `Replying to ${replyTo.user?.name}...` : "Write a comment..."}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm outline-none"
                />
                <button type="submit" disabled={!newComment.trim() || loading} className="text-blue-600 font-bold disabled:opacity-50">Post</button>
            </form>
        </div>
    );
};

export default CommentSection;
