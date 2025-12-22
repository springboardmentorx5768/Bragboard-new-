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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-brand-dark/60 backdrop-blur-xl animate-fade-in" onClick={onClose}>
            <div className="lumina-card w-full max-w-2xl overflow-hidden relative border border-black/5 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Media Section */}
                    {(brag.image_url || brag.video_url) && (
                        <div className="bg-black/[0.01] dark:bg-white/[0.02] flex flex-col items-center justify-center p-6 border-r border-black/5 dark:border-white/5 space-y-4">
                            {brag.image_url && (
                                <img src={brag.image_url} alt="Post" className="max-w-full max-h-[30vh] object-contain rounded-2xl shadow-inner border border-black/5 dark:border-white/10" />
                            )}
                            {brag.video_url && (
                                <video src={brag.video_url} controls className="max-w-full max-h-[30vh] rounded-2xl shadow-inner border border-black/5 dark:border-white/10" />
                            )}
                        </div>
                    )}

                    {/* Content Section */}
                    <div className={`p-10 flex flex-col ${!brag.image_url ? 'md:col-span-2' : ''}`}>
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 border border-black/5 dark:border-white/10 flex items-center justify-center text-white font-black text-xl">
                                    {brag.author_name?.charAt(0) || 'C'}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{currentUserId === brag.user_id ? 'You' : (brag.author_name || 'Colleague')}</h3>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{new Date(brag.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {currentUserId === brag.user_id && !isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-brand-primary transition-all border border-white/5"
                                        title="Edit Post"
                                    >
                                        <FaEdit />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all border border-white/5"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="flex-1 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Illuminate Title</label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-primary outline-none text-slate-900 dark:text-white font-black text-xl"
                                        placeholder="Headline..."
                                    />
                                </div>
                                <textarea
                                    value={editForm.content}
                                    onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                    rows="8"
                                    className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl px-6 py-4 outline-none text-slate-700 dark:text-slate-300 resize-none focus:ring-2 focus:ring-brand-primary/50 text-base leading-relaxed"
                                    placeholder="The story..."
                                />
                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-3 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                                        disabled={loading}
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="px-8 py-3 bg-white text-brand-dark font-black rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all lumina-glow hover:scale-105"
                                    >
                                        {loading ? 'Transmitting...' : 'Save Evolution'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight tracking-tight">{brag.title}</h2>

                                {brag.tagged_users && brag.tagged_users.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4 items-center">
                                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Tied Sparks:</span>
                                        {brag.tagged_users.map(u => (
                                            <span key={u.id} className="px-3 py-1 rounded-lg text-[10px] font-black bg-brand-primary/10 text-brand-primary uppercase border border-brand-primary/10">
                                                @{u.name.split(' ')[0]}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {brag.image_url && (
                                    <div className="mt-8 relative group/img overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
                                        <div className="absolute inset-0 bg-brand-primary/10 opacity-0 group-hover/img:opacity-100 transition-opacity z-10" />
                                        <img src={brag.image_url} alt="Brag attachment" className="max-h-60 w-full object-cover group-hover/img:scale-105 transition-transform duration-1000" />
                                    </div>
                                )}
                                {brag.video_url && (
                                    <div className="mt-4 relative overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
                                        <video src={brag.video_url} controls className="w-full max-h-60 object-cover" />
                                    </div>
                                )}
                                <div className="text-slate-700 dark:text-slate-300 leading-relaxed overflow-y-auto flex-1 font-medium text-base space-y-4">
                                    <p className="whitespace-pre-wrap">{brag.content}</p>
                                </div>

                                {currentUserId === brag.user_id && onDelete && (
                                    <div className="mt-10 pt-6 border-t border-white/5 flex justify-end">
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Vanish this spark?")) {
                                                    onDelete(brag.id);
                                                    onClose();
                                                }
                                            }}
                                            className="flex items-center gap-3 px-6 py-3 text-slate-500 hover:text-red-400 font-black text-[10px] uppercase tracking-widest transition-all rounded-xl hover:bg-red-500/5"
                                        >
                                            <FaTrash /> Vanish Post
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BragModal;
