import React, { useState, useEffect } from 'react';
import { FaTrash, FaTimes, FaEdit, FaSave } from 'react-icons/fa';

const BragModal = ({ brag, onClose, currentUserId, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', content: '', tags: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (brag) {
            setEditForm({
                title: brag.title,
                content: brag.content,
                tags: brag.tags || ''
            });
            setIsEditing(false);
        }
    }, [brag]);

    if (!brag) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/brags/${brag.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...editForm,
                    image_url: brag.image_url // Preserve existing image for now
                })
            });

            if (res.ok) {
                const updatedBrag = await res.json();
                if (onUpdate) onUpdate(updatedBrag);
                setIsEditing(false);
            } else {
                alert("Failed to update post");
            }
        } catch (error) {
            console.error("Error updating post", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Image Section - Only show if image exists */}
                    {brag.image_url && (
                        <div className="bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
                            <img src={brag.image_url} alt="Post" className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-sm" />
                        </div>
                    )}

                    {/* Content Section - Span full width if no image */}
                    <div className={`p-8 flex flex-col ${!brag.image_url ? 'md:col-span-2' : ''}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                {/* Avatar removed as per request */}
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{brag.author_name || 'Colleague'}</h3>
                                    <p className="text-gray-500 text-xs">{new Date(brag.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {currentUserId === brag.user_id && !isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-full"
                                        title="Edit Post"
                                    >
                                        <FaEdit />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-100 dark:bg-gray-700 p-2 rounded-full"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="flex-1 space-y-4">
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full text-2xl font-bold bg-transparent border-b-2 border-indigo-200 focus:border-indigo-600 outline-none text-gray-900 dark:text-white pb-1"
                                    placeholder="Title"
                                />
                                <input
                                    type="text"
                                    value={editForm.tags}
                                    onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                                    className="w-full text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 outline-none text-gray-700 dark:text-gray-300"
                                    placeholder="Tags (comma separated)"
                                />
                                <textarea
                                    value={editForm.content}
                                    onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                    rows="10"
                                    className="w-full bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 outline-none text-gray-600 dark:text-gray-300 resize-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="Content"
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-gray-500 font-medium hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md flex items-center gap-2"
                                    >
                                        {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{brag.title}</h2>

                                {brag.tagged_users && brag.tagged_users.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3 items-center text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">With:</span>
                                        {brag.tagged_users.map(u => (
                                            <span key={u.id} className="font-semibold text-indigo-600 dark:text-indigo-400">
                                                @{u.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {brag.tags && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {brag.tags.split(',').map((tag, idx) => (
                                            <span key={idx} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium px-3 py-1 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed overflow-y-auto flex-1">
                                    <p className="whitespace-pre-wrap">{brag.content}</p>
                                </div>

                                {currentUserId === brag.user_id && onDelete && (
                                    <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Delete this post?")) {
                                                    onDelete(brag.id);
                                                    onClose();
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-2"
                                        >
                                            <FaTrash /> Delete Post
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BragModal;
