import React, { useState } from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const ReportModal = ({ shoutoutId, onClose }) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const token = localStorage.getItem('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/shoutouts/${shoutoutId}/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ shoutout_id: shoutoutId, reason: reason })
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                alert("Failed to send report. Please try again.");
            }
        } catch (error) {
            console.error("Error reporting shoutout:", error);
            alert("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-red-100 dark:border-red-900/30 overflow-hidden transform transition-all scale-100">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                            <FaExclamationTriangle />
                            Report Shoutout
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <FaTimes />
                        </button>
                    </div>

                    {success ? (
                        <div className="text-center py-8 text-green-600 font-bold animate-pulse">
                            Report sent successfully!
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Please describe why you are reporting this shoutout. Our admins will review it shortly.
                            </p>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason for reporting..."
                                className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
                                required
                            />
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !reason.trim()}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    {loading ? 'Sending...' : 'Send Report'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
