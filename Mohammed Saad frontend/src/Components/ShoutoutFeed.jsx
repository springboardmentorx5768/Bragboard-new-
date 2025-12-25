import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
// Added FaCalendarAlt to the imports for the date badge
import { FaQuoteLeft, FaTrash, FaFilter, FaUsers, FaSync, FaCalendarAlt, FaBuilding, FaEraser, FaUserEdit, FaSearch } from "react-icons/fa";

const API_BASE = "http://127.0.0.1:9000";

export default function ShoutoutFeed({ currentUserId }) {
    // ... [States and fetch logic remain the same as your provided code]
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
            } catch (err) {
                console.error("Error fetching users:", err);
            }
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
            const data = await res.json();
            setFeed(data);
        } catch (err) {
            console.error("Error fetching feed:", err);
        } finally {
            setIsLoading(false);
        }
    }, [filters, currentUserId]);

    useEffect(() => { fetchFeed(); }, [fetchFeed]);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this shout-out?")) return;
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/shoutouts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchFeed();
    };

    // Helper to check if the post is from today
    const isToday = (dateString) => {
        const today = new Date().toISOString().split('T')[0];
        return dateString === today;
    };

    return (
        <div className="w-full mt-10 space-y-8">
            {/* ... [Filter Bar section remains same as your provided code] */}
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl space-y-6 transition-all hover:shadow-cyan-500/10">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                    <FaSearch className="text-cyan-400 text-2xl" />
                    <h3 className="text-xl font-bold text-white tracking-widest uppercase">Filter Explorations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="group space-y-2">
                        <label className="flex items-center gap-2 text-cyan-300 text-xs font-black uppercase tracking-tighter ml-1">
                            <FaCalendarAlt className="text-lg" /> Date Range
                        </label>
                        <input type="date" value={filters.date} className="w-full bg-black/40 text-white px-4 py-3 rounded-2xl text-sm outline-none border border-white/10 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all font-bold" onChange={(e) => setFilters({...filters, date: e.target.value})} />
                    </div>
                    <div className="group space-y-2">
                        <label className="flex items-center gap-2 text-purple-300 text-xs font-black uppercase tracking-tighter ml-1">
                            <FaBuilding className="text-lg" /> Team
                        </label>
                        <select value={filters.department} className="w-full bg-black/40 text-white px-4 py-3 rounded-2xl text-sm outline-none border border-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all font-bold appearance-none cursor-pointer" onChange={(e) => setFilters({...filters, department: e.target.value})}>
                            <option value="">All Departments</option>
                            <option value="Sales">Sales</option><option value="IT">IT</option><option value="HR">HR</option><option value="Finance">Finance</option>
                        </select>
                    </div>
                    <div className="group space-y-2">
                        <label className="flex items-center gap-2 text-yellow-300 text-xs font-black uppercase tracking-tighter ml-1">
                            <FaUserEdit className="text-lg" /> Contributor
                        </label>
                        <select value={filters.sender_id} className="w-full bg-black/40 text-white px-4 py-3 rounded-2xl text-sm outline-none border border-white/10 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all font-bold appearance-none cursor-pointer" onChange={(e) => setFilters({...filters, sender_id: e.target.value})}>
                            <option value="">Everyone</option>
                            {users.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        {currentUserId && (
                            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => setFilters({...filters, onlyMe: !filters.onlyMe})} className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 border shadow-lg ${filters.onlyMe ? 'bg-cyan-500 text-black border-cyan-400 shadow-cyan-500/40' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>
                                <FaFilter className="text-lg" /> {filters.onlyMe ? "My Feed" : "Global"}
                            </motion.button>
                        )}
                    </div>
                    <div className="flex items-end">
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => setFilters({ onlyMe: false, department: '', date: '', sender_id: '' })} className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-3">
                            <FaEraser className="text-lg" /> Reset
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* FEED SECTION HEADER */}
            <div className="flex justify-between items-center px-4">
                <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
                    RECOGNITION FEED
                    {isLoading && <FaSync className="animate-spin text-xl text-cyan-400" />}
                </h2>
            </div>

            <div className="grid gap-6 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
                {feed.length === 0 && !isLoading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/10">
                        <p className="text-gray-400 text-xl font-bold italic">No achievements found for these criteria. 🌟</p>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        {feed.map(post => (
                            <motion.div 
                                key={post.id} 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, x: -50 }}
                                className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-xl group hover:border-cyan-400/40 transition-all hover:bg-white/10"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <FaQuoteLeft className="text-cyan-400 text-3xl opacity-40 shrink-0" />
                                        <p className="text-white text-xl font-semibold italic leading-relaxed">"{post.message}"</p>
                                    </div>
                                    {post.sender_id === currentUserId && (
                                        <button 
                                            onClick={() => handleDelete(post.id)} 
                                            className="text-red-400 hover:text-white hover:bg-red-500 p-3 transition-all rounded-2xl opacity-0 group-hover:opacity-100 shadow-lg"
                                        >
                                            <FaTrash size={20}/>
                                        </button>
                                    )}
                                </div>
                                <div className="mt-8 flex justify-between items-end border-t border-white/10 pt-6">
                                    <div className="text-sm font-black uppercase tracking-widest flex flex-wrap items-center gap-2">
                                        <span className="text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-lg">{post.sender_name}</span>
                                        <span className="text-white opacity-20">→</span>
                                        <span className="text-purple-400 bg-purple-400/10 px-3 py-1 rounded-lg flex items-center gap-2">
                                            {post.recipient_names && post.recipient_names.length > 1 && <FaUsers />}
                                            {post.recipient_names?.join(", ")}
                                        </span>
                                    </div>

                                    {/* 🚀 NEW ATTRACTIVE DATE BADGE */}
                                    <div className="flex flex-col items-end gap-2">
                                        {isToday(post.date) && (
                                            <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/20 px-3 py-1 rounded-full animate-pulse uppercase tracking-widest border border-cyan-400/30">
                                                Live Today
                                            </span>
                                        )}
                                        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/5 shadow-inner group-hover:border-cyan-400/30 transition-all">
                                            <FaCalendarAlt className="text-cyan-400 text-sm" />
                                            <span className="text-gray-400 text-xs font-black uppercase tracking-widest">
                                                {post.date ? new Date(post.date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                }) : "Recent"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}