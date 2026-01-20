import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
    FaQuoteLeft, FaTrash, FaSync, FaCalendarAlt, 
    FaBuilding, FaEraser, FaUserEdit, FaSearch, 
    FaThumbsUp, FaHands, FaStar, FaCommentDots, FaPaperPlane, FaThumbtack, FaBolt,
    FaFlag // 👈 1. Added Flag Icon
} from "react-icons/fa";

const API_BASE = "http://127.0.0.1:9000";

export default function ShoutoutFeed({ currentUserId }) {
    const [feed, setFeed] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ onlyMe: false, department: '', date: '', sender_id: '' });
    const [commentInputs, setCommentInputs] = useState({}); 

    // 👈 2. Added Report Handler for Demo
    const handleReport = (postId) => {
        // For the demo, we simulate a successful report
        alert(`Post #${postId} has been reported to the Admin Dashboard for review.`);
        // In a real app, you would fetch(`${API_BASE}/shoutouts/${postId}/report`, { method: 'POST' })
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_BASE}/shoutouts/users`);
            if (res.ok) setUsers(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchFeed = useCallback(async () => {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (filters.onlyMe && currentUserId) params.append('recipient_id', currentUserId);
        if (filters.department) params.append('department', filters.department);
        if (filters.date) params.append('date', filters.date);
        if (filters.sender_id) params.append('sender_id', filters.sender_id);

        try {
            const res = await fetch(`${API_BASE}/shoutouts/?${params.toString()}`);
            if (res.ok) setFeed(await res.json());
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    }, [filters, currentUserId]);

    useEffect(() => { fetchUsers(); fetchFeed(); }, [fetchFeed]);

    const handleReact = async (id, type) => {
        const token = localStorage.getItem('access_token');
        if (!token) return alert("Please login!");
        await fetch(`${API_BASE}/shoutouts/${id}/react?reaction_type=${type}`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchFeed();
    };

    const handleCommentSubmit = async (id) => {
        const text = commentInputs[id];
        if (!text?.trim()) return;
        const token = localStorage.getItem('access_token');
        const fd = new FormData(); fd.append('content', text);
        const res = await fetch(`${API_BASE}/shoutouts/${id}/comments`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
        });
        if (res.ok) { setCommentInputs({ ...commentInputs, [id]: '' }); fetchFeed(); }
    };

    const getRecencyBadge = (isoString) => {
        if (!isoString) return null;
        const diff = (new Date() - new Date(isoString)) / 1000 / 60; 
        if (diff < 60) return <span className="flex items-center gap-1 bg-green-500/20 text-green-400 text-[9px] px-2 py-0.5 rounded-full border border-green-500/30 animate-pulse"><FaBolt /> NEW</span>;
        return null;
    };

    const getTooltipText = (names) => {
        if (!names || names.length === 0) return "No reactions";
        return names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
    };

    return (
        <div className="w-full max-w-6xl mx-auto mt-10 pb-20 space-y-12 px-4">
            {/* 🔍 SMART EXPLORER UI stays the same */}
            <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-cyan-500/20 p-3 rounded-2xl"><FaSearch className="text-cyan-400 text-2xl" /></div>
                        <h3 className="text-2xl font-black text-white tracking-widest uppercase">Smart Explorer</h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    <input type="date" value={filters.date} className="bg-white/5 text-white px-5 py-4 rounded-2xl border border-white/10" onChange={(e) => setFilters({...filters, date: e.target.value})} />
                    <select value={filters.department} className="bg-white/5 text-white px-5 py-4 rounded-2xl border border-white/10" onChange={(e) => setFilters({...filters, department: e.target.value})}>
                        <option value="" className="bg-gray-900">All Teams</option>
                        {["Sales", "IT", "HR", "Finance"].map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
                    </select>
                    <select value={filters.sender_id} className="bg-white/5 text-white px-5 py-4 rounded-2xl border border-white/10" onChange={(e) => setFilters({...filters, sender_id: e.target.value})}>
                        <option value="" className="bg-gray-900">Everyone</option>
                        {users.map(u => <option key={u.id} value={u.id} className="bg-gray-900">{u.name}</option>)}
                    </select>
                    <button onClick={() => setFilters({...filters, onlyMe: !filters.onlyMe})} className={`py-4 rounded-2xl font-black text-xs uppercase border ${filters.onlyMe ? 'bg-cyan-500 text-black' : 'bg-white/5 text-white border-white/10'}`}>
                        {filters.onlyMe ? "My Feed" : "Global"}
                    </button>
                    <button onClick={() => setFilters({ onlyMe: false, department: '', date: '', sender_id: '' })} className="py-4 rounded-2xl font-black text-xs uppercase bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center gap-3"><FaEraser /> Reset</button>
                </div>
            </div>

            {/* 📰 FEED */}
            <div className="space-y-10">
                {feed.map((post) => (
                    <div key={post.id} className="bg-white/5 backdrop-blur-xl p-10 rounded-[4rem] border border-white/10 shadow-2xl relative group">
                        
                        {/* 🚩 3. ADDED REPORT FLAG BUTTON */}
                        <button 
                            onClick={() => handleReport(post.id)}
                            className="absolute top-8 right-8 text-white/20 hover:text-red-500 transition-all z-10 p-2 hover:bg-red-500/10 rounded-full"
                            title="Report this post"
                        >
                            <FaFlag size={20} />
                        </button>

                        <div className="flex flex-col lg:flex-row gap-10">
                            <div className="flex-1 space-y-8">
                                <div className="flex gap-6">
                                    <FaQuoteLeft className="text-cyan-400 text-5xl opacity-20 shrink-0" />
                                    <p className="text-white text-3xl font-bold italic leading-tight">{post.message}</p>
                                </div>
                                {post.attachment_url && <div className="rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-2xl"><img src={`${API_BASE}${post.attachment_url}`} className="w-full max-h-[500px] object-cover" alt="attachment" /></div>}
                                
                                {/* Reactions, Comments, and Sidebar remain the same */}
                                <div className="flex flex-wrap gap-4 pt-4 border-b border-white/5 pb-8">
                                    {[
                                        { type: 'like', icon: <FaThumbsUp />, color: 'text-blue-400' },
                                        { type: 'clap', icon: <FaHands />, color: 'text-orange-400' },
                                        { type: 'star', icon: <FaStar />, color: 'text-yellow-400' }
                                    ].map((btn) => (
                                        <div key={btn.type} className="relative group/tooltip">
                                            <button onClick={() => handleReact(post.id, btn.type)} className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                                                <span className={`${btn.color} text-2xl`}>{btn.icon}</span>
                                                <span className="text-white text-lg font-black">{post.reactions?.[btn.type]?.count || 0}</span>
                                            </button>
                                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/tooltip:opacity-100 bg-gray-900 text-[10px] px-3 py-2 rounded-xl border border-white/10 text-white whitespace-nowrap z-50">{getTooltipText(post.reactions?.[btn.type]?.names)}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6 pt-4">
                                    <div className="flex items-center gap-3 text-cyan-400 font-black text-xs uppercase tracking-widest"><FaCommentDots /> {post.comments?.length || 0} Discussions</div>
                                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                        {post.comments?.map((comment) => (
                                            <div key={comment.id} className="flex gap-4 items-start">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs border-2 ${comment.is_sender ? 'bg-gradient-to-br from-yellow-400 to-orange-600 border-yellow-200' : 'bg-white/10 border-white/5'}`}>
                                                    {comment.is_sender ? <FaThumbtack className="rotate-45" /> : comment.user_name.charAt(0)}
                                                </div>
                                                <div className={`p-4 rounded-[2rem] rounded-tl-none flex-1 border transition-all ${comment.is_sender ? 'bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-white/5 border-white/5'}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-black text-[10px] uppercase tracking-wider ${comment.is_sender ? 'text-yellow-400' : 'text-cyan-400'}`}>{comment.user_name}</span>
                                                            {comment.is_sender && <span className="bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">Author</span>}
                                                            {getRecencyBadge(comment.created_at)}
                                                        </div>
                                                    </div>
                                                    <p className="text-white text-sm leading-relaxed">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-4 mt-6">
                                        <input type="text" placeholder="Add thoughts..." value={commentInputs[post.id] || ''} onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-3xl outline-none focus:border-cyan-400/50 text-sm font-bold" />
                                        <button onClick={() => handleCommentSubmit(post.id)} className="bg-cyan-500 text-black px-8 rounded-3xl font-black text-xs uppercase hover:bg-cyan-400 flex items-center gap-2 transition-all shadow-lg active:scale-95"><FaPaperPlane /> Post</button>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:w-72 flex flex-col justify-between border-l border-white/10 pl-10">
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em]">Recognized By</p>
                                        <p className="text-white text-xl font-black">{post.sender_name}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">For Teammates</p>
                                        <div className="flex flex-wrap gap-2">
                                            {post.recipient_names?.map((n, i) => <span key={i} className="bg-purple-500/20 px-3 py-1 rounded-lg text-xs font-bold text-purple-200 border border-purple-500/20">{n}</span>)}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-10 flex items-center gap-3 text-gray-500">
                                    <FaCalendarAlt className="text-cyan-500" />
                                    <span className="text-xs font-black uppercase tracking-widest">{post.date}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}