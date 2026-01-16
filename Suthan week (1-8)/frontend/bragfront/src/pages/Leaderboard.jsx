import React, { useState, useEffect } from 'react';
import { FaTrophy, FaStar, FaThumbsUp, FaBullhorn, FaMedal } from 'react-icons/fa';
import { FaHandsClapping } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';

const Leaderboard = () => {
    const [data, setData] = useState({ overall: [], top_contributors: [], most_tagged: [] });
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch('/api/admin/leaderboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [token]);

    const [activeSection, setActiveSection] = useState('overall'); // 'overall', 'contributors', 'tagged'

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const topThree = data.overall.slice(0, 3);

    const sections = [
        { id: 'overall', label: 'Overall Rankings', icon: FaTrophy, color: 'indigo' },
        { id: 'contributors', label: 'Top Contributors', icon: FaBullhorn, color: 'emerald' },
        { id: 'tagged', label: 'Most Tagged', icon: FaStar, color: 'pink' }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header section */}
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-block p-3 bg-yellow-500/10 rounded-2xl text-yellow-600 dark:text-yellow-400 mb-2"
                >
                    <FaTrophy size={40} />
                </motion.div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Wall of Appreciation</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    Celebrate our top contributors and most appreciated team members.
                </p>

                {/* Section Navigation Tabs */}
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all border-2 ${activeSection === section.id
                                    ? `bg-${section.color}-500 text-white border-${section.color}-500 shadow-lg shadow-${section.color}-500/20 scale-105`
                                    : `bg-white dark:bg-gray-800 text-gray-500 border-transparent hover:border-gray-200 dark:hover:border-gray-700`
                                }`}
                        >
                            <section.icon size={16} />
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Pointing System Card (Only shown on Overall) */}
                {activeSection === 'overall' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700 mt-6 text-gray-600 dark:text-gray-300"
                    >
                        {[
                            { icon: FaBullhorn, color: 'text-purple-500', pts: '+50', label: 'Receive Post' },
                            { icon: FaBullhorn, color: 'text-indigo-500', pts: '+30', label: 'Send Post' },
                            { icon: FaStar, color: 'text-yellow-500', pts: '+20', label: 'Each Star' },
                            { icon: FaHandsClapping, color: 'text-blue-500', pts: '+10', label: 'Each Clap' },
                            { icon: FaThumbsUp, color: 'text-emerald-500', pts: '+5', label: 'Each Like' },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center p-2">
                                <item.icon className={item.color} size={20} />
                                <span className="font-black text-gray-900 dark:text-white mt-1">{item.pts}</span>
                                <span className="text-[10px] uppercase font-bold tracking-tighter">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {activeSection === 'overall' && (
                    <motion.div
                        key="overall"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-16"
                    >
                        {/* Podium */}
                        <div className="flex items-end justify-center gap-2 md:gap-8 pt-10">
                            {/* 2nd Place */}
                            {topThree[1] && (
                                <div className="flex flex-col items-center">
                                    <div className="relative mb-4 group cursor-pointer">
                                        <div className="absolute -inset-2 bg-gray-400/20 rounded-full blur-xl group-hover:bg-gray-400/40 transition-all duration-500"></div>
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[1].user.name === 'Suthan' ? 'SuthanMale' : topThree[1].user.id}`} className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-gray-300 dark:border-gray-600 relative z-10 bg-white" alt="" />
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gray-400 text-white font-black px-2 py-0.5 rounded-full z-20 text-xs shadow-lg">#2</div>
                                    </div>
                                    <div className="w-28 md:w-40 bg-gradient-to-t from-gray-200 to-white dark:from-gray-800 dark:to-gray-700 h-28 md:h-40 rounded-t-3xl flex flex-col items-center justify-center border-x border-t border-gray-200 dark:border-gray-600 shadow-2xl">
                                        <span className="font-bold text-gray-900 dark:text-white text-sm md:text-base px-2 text-center line-clamp-1">{topThree[1].user.name}</span>
                                        <span className="text-xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">{topThree[1].points}</span>
                                        <span className="text-[10px] text-gray-400 uppercase font-black">Points</span>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place */}
                            {topThree[0] && (
                                <div className="flex flex-col items-center z-10">
                                    <div className="relative mb-4 group cursor-pointer -translate-y-4">
                                        <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-2xl group-hover:bg-yellow-500/40 transition-all duration-700"></div>
                                        <FaMedal className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-500 drop-shadow-[0_10px_10px_rgba(234,179,8,0.4)] animate-bounce" size={40} />
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[0].user.name === 'Suthan' ? 'SuthanMale' : topThree[0].user.id}`} className="w-28 h-28 md:w-40 md:h-40 rounded-full border-8 border-yellow-500 relative z-10 bg-white shadow-2xl" alt="" />
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-black px-4 py-1 rounded-full z-20 text-sm shadow-xl">CHAMPION</div>
                                    </div>
                                    <div className="w-32 md:w-52 bg-gradient-to-t from-yellow-100 to-white dark:from-yellow-900/40 dark:to-yellow-800/20 h-40 md:h-60 rounded-t-[3rem] flex flex-col items-center justify-center border-x border-t border-yellow-500/30 shadow-[0_-20px_60px_-20px_rgba(234,179,8,0.4)]">
                                        <span className="font-extrabold text-gray-900 dark:text-white text-sm md:text-xl px-2 text-center line-clamp-1">{topThree[0].user.name}</span>
                                        <span className="text-3xl md:text-5xl font-black text-yellow-600 dark:text-yellow-400">{topThree[0].points}</span>
                                        <span className="text-xs text-yellow-600 font-black uppercase tracking-widest mt-1">Elite Rank</span>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {topThree[2] && (
                                <div className="flex flex-col items-center">
                                    <div className="relative mb-4 group cursor-pointer">
                                        <div className="absolute -inset-2 bg-orange-700/10 rounded-full blur-xl group-hover:bg-orange-700/30 transition-all duration-500"></div>
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[2].user.name === 'Suthan' ? 'SuthanMale' : topThree[2].user.id}`} className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-orange-700/40 dark:border-orange-700/60 relative z-10 bg-white" alt="" />
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-orange-700 text-white font-black px-2 py-0.5 rounded-full z-20 text-xs shadow-lg">#3</div>
                                    </div>
                                    <div className="w-28 md:w-40 bg-gradient-to-t from-orange-50 to-white dark:from-gray-800 dark:to-gray-700 h-20 md:h-28 rounded-t-3xl flex flex-col items-center justify-center border-x border-t border-gray-200 dark:border-gray-600 shadow-2xl">
                                        <span className="font-bold text-gray-900 dark:text-white text-sm md:text-base px-2 text-center line-clamp-1">{topThree[2].user.name}</span>
                                        <span className="text-xl md:text-3xl font-black text-orange-600 dark:text-orange-400">{topThree[2].points}</span>
                                        <span className="text-[10px] text-gray-400 uppercase font-black">Points</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* List for overall points */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <span className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500"><FaTrophy size={16} /></span>
                                Full Rankings
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
                                {data.overall.map((entry, idx) => (
                                    <div
                                        key={entry.user.id}
                                        className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-xl transition-all group"
                                    >
                                        <div className="w-10 text-center font-black text-gray-400 dark:text-gray-500 text-lg">#{idx + 1}</div>
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.name === 'Suthan' ? 'SuthanMale' : entry.user.id}`} className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" alt="" />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base">{entry.user.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">{entry.user.department?.name || 'Central Team'}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{entry.points}</div>
                                            <div className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Points</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeSection === 'contributors' && (
                    <motion.div
                        key="contributors"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 max-w-2xl mx-auto"
                    >
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500"><FaBullhorn size={16} /></span>
                            Top Contributors
                        </h2>
                        <div className="space-y-3">
                            {data.top_contributors.map((entry, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800/40 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-700/50 flex items-center gap-4 shadow-lg">
                                    <span className="font-black text-gray-400 w-8 text-lg">#{idx + 1}</span>
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.name === 'Suthan' ? 'SuthanMale' : entry.user.id}`} className="w-14 h-14 rounded-2xl" alt="" />
                                    <div className="flex-1">
                                        <p className="font-black text-lg text-gray-900 dark:text-white leading-none">{entry.user.name}</p>
                                        <p className="text-xs text-gray-500 uppercase font-black mt-1 leading-none">{entry.user.department?.name}</p>
                                    </div>
                                    <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-2xl font-black text-sm">
                                        {entry.count} Posts Sent
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeSection === 'tagged' && (
                    <motion.div
                        key="tagged"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 max-w-2xl mx-auto"
                    >
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center text-pink-500"><FaStar size={16} /></span>
                            Most Tagged
                        </h2>
                        <div className="space-y-3">
                            {data.most_tagged.map((entry, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800/40 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-700/50 flex items-center gap-4 shadow-lg">
                                    <span className="font-black text-gray-400 w-8 text-lg">#{idx + 1}</span>
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.name === 'Suthan' ? 'SuthanMale' : entry.user.id}`} className="w-14 h-14 rounded-2xl" alt="" />
                                    <div className="flex-1">
                                        <p className="font-black text-lg text-gray-900 dark:text-white leading-none">{entry.user.name}</p>
                                        <p className="text-xs text-gray-500 uppercase font-black mt-1 leading-none">{entry.user.department?.name}</p>
                                    </div>
                                    <div className="bg-pink-500/10 text-pink-500 px-4 py-2 rounded-2xl font-black text-sm">
                                        {entry.count} Tagged
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {data.overall.length === 0 && (
                <div className="text-center py-20 opacity-30">
                    <p className="text-xl font-bold italic text-gray-500 dark:text-gray-400">The board is waiting for its first hero...</p>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
