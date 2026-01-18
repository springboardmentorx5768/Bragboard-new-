import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaTrophy, FaMedal } from 'react-icons/fa';
import { API_BASE_URL } from '../config';

const Leaderboard = () => {
    const { token } = useAuth();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/admin/leaderboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setLeaders(data);
                }
            } catch (err) {
                console.error("Error fetching leaderboard", err);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchLeaderboard();
    }, [token]);

    const getRankIcon = (rank) => {
        if (rank === 1) return <FaTrophy className="text-yellow-400 text-2xl" />;
        if (rank === 2) return <FaMedal className="text-gray-400 text-2xl" />;
        if (rank === 3) return <FaMedal className="text-amber-600 text-2xl" />;
        return <span className="text-gray-500 font-bold text-lg">#{rank}</span>;
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading leaderboard...</div>;

    return (
        <div className="w-full pb-20">
            <div className="px-4 md:px-8">
                <h1 className="text-3xl font-bold text-center text-green-900 mb-2 mt-8">🏆 Hall of Fame</h1>
                <p className="text-center text-gray-500 mb-6">Top contributors spreading appreciation!</p>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-center text-sm text-blue-800 shadow-sm">
                    <p>
                        <span className="font-bold">EARN POINTS:</span> 📣 Send a Shoutout = <span className="font-bold">10 pts</span> <span className="mx-2 text-blue-300">|</span> 🎁 Receive a Shoutout = <span className="font-bold">5 pts</span>
                    </p>
                </div>
            </div>

            <div className="bg-white shadow-xl border-t border-b border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                        <thead className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
                            <tr>
                                <th className="w-24 px-2 py-4 text-left pl-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
                                <th className="px-2 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-2 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                                <th className="w-20 px-2 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {leaders.map((entry) => (
                                <tr key={entry.user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-2 py-4 whitespace-nowrap text-left pl-4">
                                        <div className="flex items-center justify-start w-8">
                                            {getRankIcon(entry.rank)}
                                        </div>
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200 overflow-hidden shrink-0">
                                                {entry.user.profile_image_url ? (
                                                    <img src={`${API_BASE_URL}${entry.user.profile_image_url}`} className="w-full h-full object-cover" alt={entry.user.name} />
                                                ) : (
                                                    entry.user.name[0]
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-gray-900 truncate">{entry.user.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap hidden md:table-cell">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                            {entry.user.department || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-right">
                                        <span className="text-lg font-bold text-green-600">{entry.score}</span>
                                        <span className="text-xs text-gray-400 ml-1">pts</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
