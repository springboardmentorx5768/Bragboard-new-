import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaTrash } from 'react-icons/fa';
import BragModal from '../components/BragModal';

const DepartmentFeed = () => {
    const navigate = useNavigate();
    const [brags, setBrags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const fetchBrags = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                // Get Current User ID to check ownership
                const userRes = await fetch('http://localhost:8000/api/me', { headers });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setCurrentUserId(userData.id);
                }

                const res = await fetch('http://localhost:8000/api/brags/department', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setBrags(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBrags();
    }, [navigate]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/brags/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setBrags(brags.filter(b => b.id !== id));
            } else {
                alert("Failed to delete post");
            }
        } catch (error) {
            console.error("Error deleting post", error);
        }
    };

    const [selectedBrag, setSelectedBrag] = useState(null);

    if (loading) return <div className="flex justify-center items-center h-screen text-indigo-600 font-bold">Loading Feed...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-10">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <FaArrowLeft />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl text-indigo-600 dark:text-indigo-300">
                        <FaUsers />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Department Feed</h1>
                </div>
            </div>

            <div className="space-y-4">
                {brags.length === 0 ? (
                    <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
                        <p className="text-gray-500">No posts yet.</p>
                    </div>
                ) : (
                    brags.map((brag) => (
                        <div
                            key={brag.id}
                            onClick={() => setSelectedBrag(brag)}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group cursor-pointer"
                        >
                            <div className="flex gap-4">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${brag.user_id}`}
                                    className="w-12 h-12 rounded-full bg-gray-100"
                                    alt="avatar"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 dark:text-white">{brag.author_name || 'Colleague'}</span>
                                        <span className="text-gray-400 text-sm">{new Date(brag.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">{brag.title}</h3>

                                    {/* Show tags if present */}
                                    {brag.tags && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {brag.tags.split(',').map((tag, idx) => (
                                                <span key={idx} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-1 rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-gray-600 dark:text-gray-300 mt-2 line-clamp-3">{brag.content}</p>

                                    {/* Show thumbnail if image present */}
                                    {brag.image_url && (
                                        <div className="mt-3">
                                            <img src={brag.image_url} alt="Post attachment" className="h-20 w-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {currentUserId === brag.user_id && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(brag.id);
                                    }}
                                    className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Post"
                                >
                                    <FaTrash />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <BragModal
                brag={selectedBrag}
                onClose={() => setSelectedBrag(null)}
                currentUserId={currentUserId}
                onDelete={handleDelete}
                onUpdate={(updatedBrag) => {
                    setBrags(brags.map(b => b.id === updatedBrag.id ? updatedBrag : b));
                }}
            />
        </div>
    );
};

export default DepartmentFeed;
