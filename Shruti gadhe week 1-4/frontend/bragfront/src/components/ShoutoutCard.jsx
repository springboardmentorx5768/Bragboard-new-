import React, { useState } from 'react';
import { FaBullhorn, FaQuoteLeft, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';

const ShoutoutCard = ({ shoutout, currentUserId, onDelete, colleagues = [], onUpdate }) => {
    const isOwner = Number(currentUserId) === Number(shoutout.sender_id);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(shoutout.message);
    const [selectedRecipients, setSelectedRecipients] = useState(shoutout.recipients.map(r => r.id));
    const [editImage, setEditImage] = useState(shoutout.image_url); // For preview/sending

    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const token = localStorage.getItem('token');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (selectedRecipients.length === 0) {
            addToast("Please select at least one recipient.", 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/shoutouts/${shoutout.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message,
                    recipient_ids: selectedRecipients,
                    image_url: editImage // Send the base64 string or url
                })
            });
            if (res.ok) {
                addToast('Shout-out updated successfully', 'success');
                setIsEditing(false);
                if (onUpdate) onUpdate();
            } else {
                const errorData = await res.json();
                addToast(`Error: ${errorData.detail || 'Failed to update'}`, 'error');
            }
        } catch (error) {
            console.error("Error updating shout-out", error);
            addToast('Error updating shout-out', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleRecipient = (userId) => {
        if (selectedRecipients.includes(userId)) {
            setSelectedRecipients(selectedRecipients.filter(id => id !== userId));
        } else {
            setSelectedRecipients([...selectedRecipients, userId]);
        }
    };

    if (isEditing) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-brand-primary shadow-lg relative animate-fade-in h-full flex flex-col justify-between">
                <div className="space-y-4">
                    <textarea
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all resize-none text-sm italic"
                        rows="3"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Edit your message..."
                    />

                    {/* Image Editing */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Image</p>
                        {editImage ? (
                            <div className="relative rounded-xl overflow-hidden mb-2 border border-gray-200 dark:border-gray-600 group/img">
                                <img src={editImage} alt="preview" className="w-full h-32 object-cover" />
                                <button
                                    onClick={() => setEditImage('')}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                                    title="Remove Image"
                                >
                                    <FaTrash size={12} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="text-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                                    + Add Photo
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Recipients</p>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 custom-scrollbar">
                            {colleagues.map(col => (
                                <button
                                    key={col.id}
                                    type="button"
                                    onClick={() => toggleRecipient(col.id)}
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${selectedRecipients.includes(col.id)
                                        ? 'bg-brand-primary text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    {col.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setIsEditing(false);
                            setMessage(shoutout.message);
                            setSelectedRecipients(shoutout.recipients.map(r => r.id));
                            setEditImage(shoutout.image_url);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <FaTimes /> Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !message.trim() || selectedRecipients.length === 0}
                        className="flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Saving...' : <><FaCheck /> Save</>}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            id={`shoutout-${shoutout.id}`}
            className="lumina-card group relative h-full flex flex-col p-1"
        >
            <div className="bg-black/[0.01] dark:bg-white/[0.02] rounded-[1.8rem] p-8 h-full flex flex-col relative overflow-hidden border border-black/5 dark:border-white/5">
                {/* Decorative Aurora Spike */}
                <div className="absolute top-[-20%] left-[-10%] w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl dark:opacity-100 opacity-50" />

                <div className="absolute top-6 right-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-20">
                    {isOwner && (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-brand-primary rounded-xl transition-all border border-white/5"
                                title="Edit"
                            >
                                <FaEdit className="text-sm" />
                            </button>
                            <button
                                onClick={() => onDelete(shoutout.id)}
                                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-white/5"
                                title="Delete"
                            >
                                <FaTrash className="text-sm" />
                            </button>
                        </>
                    )}
                </div>

                <div className="flex items-start gap-6 flex-1">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <FaBullhorn className="text-white text-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-primary rounded-full border-2 border-brand-dark shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="mb-4">
                            <span className="block font-black text-slate-900 dark:text-white text-lg tracking-tight leading-none mb-1">{isOwner ? 'You' : shoutout.sender_name}</span>
                            <span className="text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Shared a Spark</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {shoutout.recipients.map(user => (
                                <span key={user.id} className="px-3 py-1 rounded-lg text-xs font-black bg-brand-primary/10 text-brand-primary uppercase tracking-[0.1em] border border-brand-primary/10">
                                    @{user.name.split(' ')[0]}
                                </span>
                            ))}
                        </div>

                        <div className="relative">
                            <FaQuoteLeft className="absolute -left-4 -top-2 text-black/5 dark:text-white/5 text-5xl" />
                            <p className="text-slate-700 dark:text-slate-300 relative z-10 italic text-base leading-relaxed font-medium">
                                "{shoutout.message}"
                            </p>
                        </div>
                        {shoutout.image_url && (
                            <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                <img src={shoutout.image_url} alt="Shoutout attachment" className="w-full h-auto object-cover max-h-64" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                    <div className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">
                        {new Date(shoutout.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex -space-x-3">
                        {shoutout.recipients.slice(0, 3).map((r, i) => (
                            <div key={r.id} className="w-7 h-7 rounded-lg bg-slate-800 border-2 border-brand-dark flex items-center justify-center text-xs font-black text-slate-400">
                                {r.name.charAt(0)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShoutoutCard;
