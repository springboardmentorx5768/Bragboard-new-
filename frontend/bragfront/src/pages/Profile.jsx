import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle, FaBuilding, FaBriefcase, FaEnvelope, FaCalendarAlt, FaTrophy, FaTrash, FaEdit, FaSave, FaTimes, FaShieldAlt } from 'react-icons/fa';

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
            if (!token) { navigate('/login'); return; }
            try {
                const headers = { 'Authorization': `Bearer ${token}` };
                const res = await fetch('http://localhost:8000/api/me', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setEditForm({ name: data.name, email: data.email, department_id: data.department?.id || "" });
                    const bragsRes = await fetch('http://localhost:8000/api/brags/my-brags', { headers });
                    if (bragsRes.ok) setMyBrags(await bragsRes.json());
                    const deptRes = await fetch('http://localhost:8000/api/departments/', { headers });
                    if (deptRes.ok) setDepartments(await deptRes.json());
                } else {
                    localStorage.removeItem('token'); navigate('/login');
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchProfile();
    }, [navigate]);

    useEffect(() => {
        if (!loading && location.state?.scrollTo === 'my-posts') {
            const element = document.getElementById('my-posts');
            if (element) setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [loading, location.state]);

    const handleUpdateProfile = async () => {
        setSaveLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/api/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editForm)
            });
            if (res.ok) { setUser(await res.json()); setIsEditing(false); }
            else { alert((await res.json()).detail || "Update failed"); }
        } catch (error) { console.error(error); } finally { setSaveLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this brag?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/brags/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setMyBrags(myBrags.filter(b => b.id !== id));
        } catch (error) { console.error(error); }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-brand-dark">
            <div className="w-16 h-16 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin" />
        </div>
    );
    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
            {/* Profile Overview */}
            <div className="relative lumina-card overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 opacity-30" />
                <div className="h-48 bg-gradient-to-r from-brand-primary/20 via-brand-dark to-brand-secondary/20 relative">
                    <div className="absolute inset-0 backdrop-blur-3xl" />
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="absolute top-8 right-8 px-6 py-2.5 lumina-glass rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/10 transition-all z-10 flex items-center gap-2">
                            <FaEdit /> Edit Profile
                        </button>
                    )}
                </div>

                <div className="px-12 pb-12 relative">
                    <div className="relative flex flex-col md:flex-row justify-between items-center md:items-end -mt-24 mb-10 gap-8">
                        <div className="relative group/avatar">
                            <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-2xl animate-pulse" />
                            <div className="relative bg-gradient-to-br from-brand-primary to-brand-secondary w-40 h-40 rounded-full ring-[6px] ring-white/5 shadow-2xl flex items-center justify-center border border-white/10 overflow-hidden">
                                <span className="text-white text-6xl font-black">{user.name?.charAt(0) || '?'}</span>
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end">
                            <div className="px-6 py-2 lumina-glass rounded-full border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary mb-4">
                                {user.role || 'Member'}
                            </div>
                        </div>
                    </div>

                    <div className="text-center md:text-left space-y-4">
                        {isEditing ? (
                            <div className="space-y-6 max-w-lg">
                                <div>
                                    <label className="block text-[8px] font-black text-slate-900 dark:text-white/90 uppercase tracking-widest mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full text-4xl font-black text-slate-800 dark:text-white bg-transparent border-b border-brand-primary/50 focus:border-brand-primary outline-none pb-2 transition-all placeholder:text-slate-700"
                                        placeholder="Identification..."
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={handleUpdateProfile} disabled={saveLoading} className="px-8 py-3 bg-white text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all lumina-glow">
                                        {saveLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="px-8 py-3 lumina-glass rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-800 dark:text-white hover:text-slate-800 dark:text-white transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{user.name || 'Anonymous'}</h1>
                                <p className="text-lg text-slate-900 dark:text-white/90 font-medium tracking-tight italic">{user.email || 'No email provided'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="lumina-card p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl" />
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-4">
                        <FaShieldAlt className="text-brand-primary" />
                        Account Details
                    </h3>
                    <div className="space-y-8">
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-white/5 rounded-2xl text-brand-primary border border-white/5">
                                <FaBuilding className="text-xl" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-900 dark:text-white/90 uppercase tracking-widest mb-1">Department</p>
                                {isEditing ? (
                                    <select
                                        value={editForm.department_id}
                                        onChange={e => setEditForm({ ...editForm, department_id: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-slate-800 dark:text-white font-bold outline-none focus:ring-1 focus:ring-brand-primary"
                                    >
                                        <option value="" disabled>Select Department</option>
                                        {departments.map(dept => <option key={dept.id} value={dept.id} className="bg-brand-dark">{dept.name}</option>)}
                                    </select>
                                ) : (
                                    <>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">{user.department?.name || "No Department"}</p>
                                        <p className="text-xs text-slate-900 dark:text-white/90 mt-1">{user.department?.description}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-white/5 rounded-2xl text-brand-secondary border border-white/5">
                                <FaCalendarAlt className="text-xl" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-900 dark:text-white/90 uppercase tracking-widest mb-1">Joined Date</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">{user.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'Unknown'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lumina-card p-10 relative overflow-hidden">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-4">
                        <FaUserCircle className="text-brand-secondary" />
                        Contact info
                    </h3>
                    <div className="flex items-start gap-6">
                        <div className="p-4 bg-white/5 rounded-2xl text-brand-primary border border-white/5">
                            <FaEnvelope className="text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-900 dark:text-white/90 uppercase tracking-widest mb-1">Email Address</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Brags */}
            <div id="my-posts" className="lumina-card overflow-hidden">
                <div className="p-10 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                        <FaTrophy className="text-brand-primary drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                        My Brags
                    </h2>
                    <div className="px-4 py-1.5 lumina-glass rounded-full border border-white/5 text-brand-primary text-xs font-black">
                        {myBrags.length} POSTS
                    </div>
                </div>
                <div className="divide-y divide-white/[0.03]">
                    {myBrags.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 text-slate-600 border border-white/5">
                                <FaTrophy className="text-3xl" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white italic opacity-50">No brags yet.</h3>
                            <button onClick={() => navigate('/dashboard')} className="mt-8 text-brand-primary text-[10px] font-black uppercase tracking-widest hover:underline transition-all">
                                Post Your First Brag
                            </button>
                        </div>
                    ) : (
                        myBrags.map((brag) => (
                            <div key={brag.id} className="p-10 hover:bg-white/[0.02] transition-all group relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex justify-between items-start mb-4 pr-12">
                                    <h4 className="font-black text-2xl text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors tracking-tight">
                                        {brag.title}
                                    </h4>
                                    <span className="text-[9px] font-black text-slate-900 dark:text-white/90 dark:text-slate-600 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 uppercase tracking-widest">
                                        {new Date(brag.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-800 dark:text-white leading-relaxed text-base font-medium max-w-3xl">
                                    {brag.content}
                                </p>
                                {brag.image_url && (
                                    <div className="mt-6 relative max-w-md rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 shadow-xl">
                                        <img src={brag.image_url} alt="Brag attachment" className="w-full object-cover" />
                                    </div>
                                )}
                                <button
                                    onClick={() => handleDelete(brag.id)}
                                    className="absolute top-10 right-10 w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-900 dark:text-white/90 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 border border-white/5"
                                    title="Delete"
                                >
                                    <FaTrash className="text-sm" />
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
