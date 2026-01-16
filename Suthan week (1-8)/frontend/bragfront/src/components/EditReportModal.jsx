import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaExclamationTriangle } from 'react-icons/fa';

const EditReportModal = ({ isOpen, onClose, report, onUpdate }) => {
    const [reason, setReason] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [tags, setTags] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (report) {
            setReason(report.reason || '');
            if (report.shoutout) {
                setTitle(report.shoutout.title || '');
                setMessage(report.shoutout.message || '');
                setTags(Array.isArray(report.shoutout.tags) ? report.shoutout.tags.join(', ') : (report.shoutout.tags || ''));
                setImageUrl(report.shoutout.image_url || '');
            }
        }
    }, [report]);

    if (!isOpen || !report) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // 1. Update Report Reason
            const reportRes = await fetch(`/api/admin/reports/${report.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });

            // 2. Update Shoutout Content if present
            let updatedShoutout = null;
            if (report.shoutout) {
                const shoutoutRes = await fetch(`/api/shoutouts/${report.shoutout_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title,
                        message,
                        image_url: imageUrl,
                        tags: tags.split(',').map(t => t.trim()).filter(t => t),
                        recipients: [] // Backend might expect this if using ShoutOutCreate schema
                    })
                });
                if (shoutoutRes.ok) {
                    updatedShoutout = await shoutoutRes.json();
                }
            }

            if (reportRes.ok) {
                const updatedReport = await reportRes.json();
                // Combine results
                if (updatedShoutout) {
                    updatedReport.shoutout = updatedShoutout;
                }
                onUpdate(updatedReport);
                onClose();
            } else {
                alert("Failed to update report");
            }
        } catch (error) {
            console.error("Error updating report/shoutout:", error);
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-gray-900 w-full max-w-2xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-red-600/10 to-transparent flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                            <FaExclamationTriangle />
                        </div>
                        <h2 className="text-xl font-bold text-white">Moderate Content</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    {/* Section 1: Report Metadata */}
                    <div className="space-y-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-800">
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-widest">Report Detail</h3>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Resolution Reason / Note</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-all min-h-[80px] resize-none text-sm"
                                placeholder="Describe the reason for report resolution..."
                                required
                            />
                        </div>
                    </div>

                    {/* Section 2: Shoutout Content (The core ask) */}
                    {report.shoutout && (
                        <div className="space-y-4 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                            <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Post Content Enforcement</h3>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Post Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
                                    placeholder="Edit title..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Post Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all min-h-[100px] resize-none text-sm"
                                    placeholder="Edit message..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Image URL</label>
                                    <input
                                        type="text"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
                                        placeholder="Image URL..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Tags (comma separated)</label>
                                    <input
                                        type="text"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
                                        placeholder="Tag1, Tag2..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !reason.trim()}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
                        >
                            <FaSave /> {loading ? 'Applying Changes...' : 'Save & Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditReportModal;
