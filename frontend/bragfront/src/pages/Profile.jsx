import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle, FaBuilding, FaBriefcase, FaEnvelope, FaCalendarAlt, FaTrophy, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const Profile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [myBrags, setMyBrags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '' });
    const [saveLoading, setSaveLoading] = useState(false);

    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch User Profile
                const res = await fetch('http://localhost:8000/api/me', { headers });

                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setEditForm({
                        name: data.name,
                        email: data.email,
                        department_id: data.department ? data.department.id : ""
                    });

                    // Fetch My Brags
                    const bragsRes = await fetch('http://localhost:8000/api/brags/my-brags', { headers });
                    if (bragsRes.ok) {
                        const bragsData = await bragsRes.json();
                        setMyBrags(bragsData);
                    }

                    // Fetch Departments
                    const deptRes = await fetch('http://localhost:8000/api/departments/', { headers });
                    if (deptRes.ok) {
                        const deptData = await deptRes.json();
                        setDepartments(deptData);
                    }
                } else {
                    // Token might be invalid
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            } catch (err) {
                console.error("Failed to fetch profile data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    useEffect(() => {
        if (!loading && location.state?.scrollTo === 'my-posts') {
            const element = document.getElementById('my-posts');
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [loading, location.state]);

    const handleUpdateProfile = async () => {
        setSaveLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/api/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                setIsEditing(false);
            } else {
                const errorData = await res.json();
                alert(errorData.detail || "Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile", error);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/brags/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setMyBrags(myBrags.filter(b => b.id !== id));
            } else {
                alert("Failed to delete post");
            }
        } catch (error) {
            console.error("Error deleting brag", error);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-indigo-600 font-bold">Loading Profile...</div>;
    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
            {/* Header and Details Grid */}
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600">
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute top-6 right-6 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2"
                        >
                            <FaEdit /> Edit Profile
                        </button>
                    )}
                </div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 w-28 h-28 rounded-full ring-4 ring-white dark:ring-gray-800 shadow-lg flex items-center justify-center">
                            <span className="text-white text-4xl font-bold">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="mb-2">
                            <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wide border border-indigo-200 dark:border-indigo-700">
                                {user.role}
                            </span>
                        </div>
                    </div>

                    <div className="text-center md:text-left">
                        {isEditing ? (
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full text-2xl font-extrabold text-gray-900 dark:text-white bg-transparent border-b-2 border-indigo-500 outline-none pb-1"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={saveLoading}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"
                                    >
                                        {saveLoading ? 'Saving...' : <><FaSave /> Save</>}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditForm({
                                                name: user.name,
                                                email: user.email,
                                                department_id: user.department ? user.department.id : ""
                                            });
                                        }}
                                        disabled={saveLoading}
                                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"
                                    >
                                        <FaTimes /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{user.name}</h1>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">{user.email}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <FaBriefcase className="text-indigo-500" />
                        Professional Details
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                <FaBuilding />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</p>
                                {isEditing ? (
                                    <select
                                        value={editForm.department_id}
                                        onChange={e => setEditForm({ ...editForm, department_id: parseInt(e.target.value) })}
                                        className="w-full text-lg font-bold text-gray-900 dark:text-white bg-transparent dark:bg-gray-800 border-b border-indigo-300 outline-none pb-1 mt-1"
                                    >
                                        <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{dept.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                            {user.department ? user.department.name : "Not Assigned"}
                                        </p>
                                        {user.department && (
                                            <p className="text-xs text-gray-400 mt-1">{user.department.description}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400">
                                <FaCalendarAlt />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined Date</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                    {user.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <FaUserCircle className="text-pink-500" />
                        Account Info
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl text-pink-600 dark:text-pink-400">
                                <FaEnvelope />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full text-lg font-bold text-gray-900 dark:text-white bg-transparent border-b border-indigo-300 outline-none"
                                    />
                                ) : (
                                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1 break-all">
                                        {user.email}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Brags Section */}
            <div id="my-posts" className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <FaTrophy className="text-amber-500" />
                        My Posts
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{myBrags.length}</span>
                    </h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {myBrags.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <FaTrophy className="text-2xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Posts Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Time to start posting about your achievements!</p>
                        </div>
                    ) : (
                        myBrags.map((brag) => (
                            <div key={brag.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group relative">
                                <div className="flex justify-between items-start mb-2 pr-8">
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {brag.title}
                                    </h4>
                                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        {new Date(brag.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {brag.content}
                                </p>
                                <button
                                    onClick={() => handleDelete(brag.id)}
                                    className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Post"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
