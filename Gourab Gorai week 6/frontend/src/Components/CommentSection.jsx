import React, { useState } from 'react';
import { FaPaperPlane, FaUserCircle, FaFlag } from 'react-icons/fa';
import ReportModal from './ReportModal';

const CommentSection = ({ shoutoutId, comments, onAddComment, currentUser, disabled }) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reportModal, setReportModal] = useState({ isOpen: false, commentId: null });

    const openReportModal = (id) => setReportModal({ isOpen: true, commentId: id });
    const closeReportModal = () => setReportModal({ isOpen: false, commentId: null });

    const handleReportSubmit = async (reason) => {
        const token = sessionStorage.getItem('access_token');
        try {
            const res = await fetch(`http://localhost:8000/reports/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    reason,
                    comment_id: reportModal.commentId
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        await onAddComment(shoutoutId, newComment);
        setNewComment('');
        setIsSubmitting(false);
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-100">
            {/* Comment List */}
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                {comments.length === 0 && (
                    <p className="text-gray-400 text-sm italic">Be the first to comment...</p>
                )}
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0 mt-1">
                            <FaUserCircle className="text-gray-300 text-2xl" />
                        </div>
                        <div className="bg-gray-50 rounded-2xl px-4 py-2 w-full">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-semibold text-gray-800">
                                    {comment.user.name}
                                    {comment.user.is_deleted === 'true' && <span className="text-gray-400 text-xs font-normal ml-1 italic">(Deleted)</span>}
                                </span>
                                <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <p className="text-gray-700">{comment.content}</p>
                                <button
                                    onClick={() => openReportModal(comment.id)}
                                    className="text-gray-400 hover:text-red-500 ml-2"
                                    title="Report Comment"
                                >
                                    <FaFlag size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Form */}
            {disabled ? (
                <div className="text-center py-2 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-gray-400 text-sm">Comments are currently disabled for this post.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="relative flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-gray-100 text-gray-800 text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border border-transparent focus:border-blue-200"
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmitting}
                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <FaPaperPlane size={14} />
                    </button>
                </form>
            )}

            <ReportModal
                isOpen={reportModal.isOpen}
                onClose={closeReportModal}
                onSubmit={handleReportSubmit}
                title="Report Comment"
            />
        </div>
    );
};

export default CommentSection;
