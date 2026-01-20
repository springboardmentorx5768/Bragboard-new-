import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
    FaQuoteLeft, FaTrash, FaFilter, FaUsers, FaSync, 
    FaCalendarAlt, FaBuilding, FaEraser, FaUserEdit, 
    FaSearch, FaThumbsUp, FaHands, FaStar
} from "react-icons/fa";

const API_BASE = "http://127.0.0.1:9000";

export default function ShoutoutFeed({ currentUserId }) {
    const [feed, setFeed] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ onlyMe: false, department: '', date: '', sender_id: '' });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`${API_BASE}/shoutouts/users`);
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (err) { console.error("Error fetching users:", err); }
        };
        fetchUsers();
    }, []);

    const fetchFeed = useCallback(async () => {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (filters.onlyMe && currentUserId) params.append('recipient_id', currentUserId);
        if (filters.department) params.append('department', filters.department);
        if (filters.date) params.append('date', filters.date);
        if (filters.sender_id) params.append('sender_id', filters.sender_id);

        try {
            const res = await fetch(`${API_BASE}/shoutouts/?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch feed");
            const data = await res.json();
            setFeed(data);
        } catch (err) { console.error("Error fetching feed:", err); }
        finally { setIsLoading(false); }
    }, [filters, currentUserId]);

    useEffect(() => { fetchFeed(); }, [fetchFeed]);

    const handleReact = async (shoutoutId, type) => {
        const token = localStorage.getItem('access_token');
        if (!token) return alert("Please login to react!");

        try {
            const res = await fetch(`${API_BASE}/shoutouts/${shoutoutId}/react?reaction_type=${type}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchFeed(); 
        } catch (err) { console.error("Reaction error:", err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/shoutouts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchFeed();
        } catch (err) { console.error("Delete error:", err); }
    };

    const isToday = (dateString) => dateString === new Date().toISOString().split('T')[0];

    // Tooltip Formatter
    const getTooltipText = (names) => {
        if (!names || names.length === 0) return "No reactions yet";
        if (names.length <= 2) return names.join(", ");
        return `${names.slice(0, 2).join(", ")} and ${names.length - 2} others`;
    };

    return (
        <div className="w-full max-w-6xl mx-auto mt-10 pb-20 space-y-12 px-4">
            {/* 🔍 MEGA FILTER BAR */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-cyan-500/20 p-3 rounded-2xl"><FaSearch className="text-cyan-400 text-2xl" /></div>
                        <h3 className="text-2xl font-black text-white tracking-widest uppercase">Smart Explorer</h3>
                    </div>
                    {isLoading && <FaSync className="animate-spin text-2xl text-cyan-400" />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    <div className="space-y-3">
                        <label className="text-cyan-300 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"><FaCalendarAlt /> Date</label>
                        <input type="date" value={filters.date} className="w-full bg-white/5 text-white px-5 py-4 rounded-2xl text-sm border border-white/10 outline-none focus:border-cyan-400 font-bold" onChange={(e) => setFilters({...filters, date: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                        <label className="text-purple-300 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"><FaBuilding /> Team</label>
                        <select value={filters.department} className="w-full bg-white/5 text-white px-5 py-4 rounded-2xl text-sm border border-white/10 outline-none focus:border-purple-400 font-bold" onChange={(e) => setFilters({...filters, department: e.target.value})}>
                            <option value="" className="bg-gray-900">All Teams</option>
                            <option value="Sales" className="bg-gray-900">Sales</option><option value="IT" className="bg-gray-900">IT</option><option value="HR" className="bg-gray-900">HR</option><option value="Finance" className="bg-gray-900">Finance</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-yellow-300 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"><FaUserEdit /> Contributor</label>
                        <select value={filters.sender_id} className="w-full bg-white/5 text-white px-5 py-4 rounded-2xl text-sm border border-white/10 outline-none focus:border-yellow-400 font-bold" onChange={(e) => setFilters({...filters, sender_id: e.target.value})}>
                            <option value="" className="bg-gray-900">Everyone</option>
                            {users.map(u => (<option key={u.id} value={u.id} className="bg-gray-900">{u.name}</option>))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={() => setFilters({...filters, onlyMe: !filters.onlyMe})} className={`w-full py-4 rounded-2xl font-black text-xs uppercase transition-all border shadow-2xl ${filters.onlyMe ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>
                            {filters.onlyMe ? "My Feed" : "Global"}
                        </button>
                    </div>
                    <div className="flex items-end">
                        <button onClick={() => setFilters({ onlyMe: false, department: '', date: '', sender_id: '' })} className="w-full py-4 rounded-2xl font-black text-xs uppercase bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center gap-3"><FaEraser /> Reset</button>
                    </div>
                </div>
            </motion.div>

            {/* 📰 THE FEED */}
            <div className="space-y-10">
                <AnimatePresence mode='popLayout'>
                    {feed.map((post, index) => (
                        <motion.div key={post.id} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="relative group">
                            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[4rem] border border-white/10 shadow-2xl group-hover:scale-[1.01] transition-all duration-500">
                                <div className="flex flex-col lg:flex-row gap-10">
                                    <div className="flex-1 space-y-8">
                                        <div className="flex gap-6">
                                            <FaQuoteLeft className="text-cyan-400 text-5xl opacity-20 shrink-0" />
                                            <p className="text-white text-3xl font-bold italic leading-tight">{post.message}</p>
                                        </div>
                                        {post.attachment_url && (
                                            <div className="rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-2xl">
                                                <img src={`${API_BASE}${post.attachment_url}`} alt="Recognition" className="w-full object-cover max-h-[500px]" />
                                            </div>
                                        )}
                                        {/* Reactions with Tooltip */}
                                        <div className="flex flex-wrap gap-4 pt-4">
                                            {[
                                                { type: 'like', icon: <FaThumbsUp />, color: 'text-blue-400', bg: 'hover:bg-blue-500/20' },
                                                { type: 'clap', icon: <FaHands />, color: 'text-orange-400', bg: 'hover:bg-orange-500/20' },
                                                { type: 'star', icon: <FaStar />, color: 'text-yellow-400', bg: 'hover:bg-yellow-500/20' }
                                            ].map((btn) => (
                                                <div key={btn.type} className="relative group/tooltip">
                                                    <motion.button
                                                        whileHover={{ y: -5 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleReact(post.id, btn.type)}
                                                        className={`flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 transition-all ${btn.bg}`}
                                                    >
                                                        <span className={`${btn.color} text-2xl`}>{btn.icon}</span>
                                                        <span className="text-white text-lg font-black">{post.reactions?.[btn.type]?.count || 0}</span>
                                                    </motion.button>
                                                    {/* Tooltip Popup */}
                                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                                                        <div className="bg-gray-900 text-white text-[11px] px-3 py-2 rounded-xl border border-white/10 shadow-2xl whitespace-nowrap font-bold">
                                                            {getTooltipText(post.reactions?.[btn.type]?.names)}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Meta Side */}
                                    <div className="lg:w-72 flex flex-col justify-between border-l border-white/10 pl-10">
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em]">Recognized By</p>
                                                <p className="text-white text-xl font-black">{post.sender_name}</p>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">For Teammates</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {post.recipient_names?.map((name, i) => (
                                                        <span key={i} className="bg-purple-500/20 text-purple-200 px-3 py-1 rounded-lg text-xs font-bold border border-purple-500/20">{name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-10 space-y-4">
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <FaCalendarAlt className="text-cyan-500" /><span className="text-xs font-black uppercase tracking-widest">{post.date}</span>
                                            </div>
                                            {isToday(post.date) && <div className="inline-block bg-cyan-500 text-black text-[10px] font-black px-4 py-1 rounded-full animate-pulse tracking-widest uppercase">New Story</div>}
                                        </div>
                                    </div>
                                </div>
                                {post.sender_id === currentUserId && (
                                    <button onClick={() => handleDelete(post.id)} className="absolute top-8 right-8 text-red-400/30 hover:text-red-400 hover:bg-red-500/10 p-4 transition-all rounded-3xl"><FaTrash size={24}/></button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}