import React, { useState, useEffect } from 'react';
import { FaClock, FaChartLine, FaUserFriends, FaBullhorn } from "react-icons/fa";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler);

const API_BASE = "http://localhost:8000";

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('week'); // day, week, month

    const [userStats, setUserStats] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('access_token');

                // Fetch Activity Chart Data
                const resActivity = await fetch(`${API_BASE}/activity/dashboard?filter=${filter}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resActivity.ok) {
                    const data = await resActivity.json();
                    setStats(data);
                }

                // Fetch User Stats (Bubbles & Lists)
                const resUserStats = await fetch(`${API_BASE}/users/me/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resUserStats.ok) {
                    const data = await resUserStats.json();
                    setUserStats(data);
                }

            } catch (err) {
                console.error("Error loading dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [filter]);

    const formatTime = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m}m`;
        return `${h}h ${m}m`;
    };

    if (loading && !stats) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load stats.</div>;

    const dailyAverage = stats.screen_time.length > 0
        ? Math.round(stats.stats.total_screen_time_minutes / stats.screen_time.length)
        : 0;

    const chartData = {
        labels: stats.screen_time.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString(undefined, { weekday: 'short' })[0]; // S, M, T, W, T, F, S
        }),
        datasets: [
            {
                label: 'Minutes',
                data: stats.screen_time.map(item => item.minutes),
                backgroundColor: '#22d3ee', // Cyan-400
                borderRadius: 4,
                hoverBackgroundColor: '#0891b2', // Cyan-600
                barThickness: 12,
            },
        ],
    };

    return (
        <div className="min-h-screen font-sans bg-slate-50 pb-20">
            <div style={{ height: '80px' }} className="w-full"></div>
            <div className="max-w-7xl mx-auto px-6">
                <h1 className="text-3xl font-bold text-green-900 mb-12">Activity</h1>
                {/* User Stats Bubbles - Aligned with Content Outside Card */}
                {userStats && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-56">
                        <div className="bg-blue-50 p-6 rounded-2xl text-center shadow-sm border border-blue-100 hover:shadow-md transition">
                            <span className="block text-4xl font-extrabold text-blue-600 mb-1">{userStats.shoutouts_sent}</span>
                            <span className="text-sm text-gray-600 font-semibold uppercase tracking-wider">Shoutouts Sent</span>
                        </div>
                        <div className="bg-green-50 p-6 rounded-2xl text-center shadow-sm border border-green-100 hover:shadow-md transition">
                            <span className="block text-4xl font-extrabold text-green-600 mb-1">{userStats.shoutouts_received}</span>
                            <span className="text-sm text-gray-600 font-semibold uppercase tracking-wider">Shoutouts Received</span>
                        </div>
                    </div>
                )}

                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                        {/* Chart Section */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <p className="text-gray-400 text-sm font-medium mb-1">Daily Average</p>
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
                                        {formatTime(dailyAverage)}
                                    </h2>
                                    <span className="text-gray-400 text-sm flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block"></span>
                                        18% from last week
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-start mb-8 gap-4 bg-gray-50/50 p-1 rounded-xl w-fit">
                                {['day', 'week', 'month'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-6 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${filter === f
                                            ? 'bg-white text-cyan-600 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            <div className="h-64 w-full">
                                <Bar
                                    data={chartData}
                                    options={{
                                        maintainAspectRatio: false,
                                        responsive: true,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                backgroundColor: '#1f2937',
                                                padding: 12,
                                                cornerRadius: 8,
                                                titleFont: { size: 12, weight: 'bold' },
                                                bodyFont: { size: 12 },
                                                displayColors: false,
                                                callbacks: {
                                                    label: (context) => `Time: ${formatTime(context.raw)}`
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                grid: {
                                                    drawBorder: false,
                                                    color: '#f1f5f9'
                                                },
                                                beginAtZero: true,
                                                ticks: {
                                                    color: '#94a3b8',
                                                    font: { size: 11 },
                                                    stepSize: 120, // 2 hour intervals
                                                    callback: (value) => value === 0 ? '0' : `${value / 60}h`
                                                }
                                            },
                                            x: {
                                                grid: { display: false },
                                                ticks: {
                                                    color: '#94a3b8',
                                                    font: { size: 12, weight: '500' },
                                                    padding: 10
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Recent Shoutouts Sidebar (Now Lists) */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full max-h-[600px] overflow-hidden">
                            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2 sticky top-0 bg-white z-10">
                                📢 Recent Activity
                            </h2>

                            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 pb-2 space-y-6">
                                {userStats && (
                                    <>
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Sent</h3>
                                            {userStats.recent_sent.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic">No shoutouts sent</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {userStats.recent_sent.map(s => (
                                                        <div key={s.id} className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-xs font-bold text-green-700">To {s.recipients}</span>
                                                                <span className="text-[10px] text-gray-400">{new Date(s.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{s.message}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Received</h3>
                                            {userStats.recent_received.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic">No shoutouts received</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {userStats.recent_received.map(s => (
                                                        <div key={s.id} className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-xs font-bold text-blue-700">From {s.sender}</span>
                                                                <span className="text-[10px] text-gray-400">{new Date(s.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{s.message}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default Dashboard;
