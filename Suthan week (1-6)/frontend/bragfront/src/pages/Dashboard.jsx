
import React, { useState, useEffect } from 'react';
import { FaTrophy, FaUsers, FaPlus, FaArrowRight, FaTimes, FaTrash, FaRocket, FaGhost, FaSmileWink, FaStar, FaRunning, FaChild, FaLaptop, FaRegCommentDots } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import CreatePostModal from '../components/CreatePostModal';
import ReactionButton, { ReactionBar } from '../components/ReactionButton';
import CommentSection from '../components/CommentSection';
import ShoutoutDetailModal from '../components/ShoutoutDetailModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'Sent', value: '0', icon: <FaTrophy />, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/30' },
    { label: 'Received', value: '0', icon: <FaUsers />, gradient: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/30' },
  ]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ departmentId: '', senderId: '', dateFrom: '', dateTo: '' });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserDepartment, setCurrentUserDepartment] = useState(null);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState(null);
  // shoutouts removed
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeComments, setActiveComments] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedShoutout, setSelectedShoutout] = useState(null);

  const toggleComments = (shoutoutId) => {
    setActiveComments(prev => ({
      ...prev,
      [shoutoutId]: !prev[shoutoutId]
    }));
  };

  const token = localStorage.getItem('token');


  const fetchData = React.useCallback(async () => {
    if (!token) return;

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const cacheBuster = `?_=${Date.now()}`;

      // Build query string for shoutouts
      let queryParams = new URLSearchParams();
      queryParams.append('_', Date.now()); // cache buster
      if (filters.departmentId) queryParams.append('department_id', filters.departmentId);
      if (filters.senderId) queryParams.append('sender_id', filters.senderId);
      if (filters.dateFrom) queryParams.append('date_from', filters.dateFrom);
      if (filters.dateTo) queryParams.append('date_to', filters.dateTo);

      // Fetch all required data in parallel
      const [userRes, usersRes, deptRes, shoutRes, receivedRes] = await Promise.all([
        fetch(`/api/me${cacheBuster}`, { headers }).catch(e => ({ error: e })),
        fetch(`/api/users${cacheBuster}`, { headers }).catch(e => ({ error: e })), // Fetch ALL users
        fetch(`/api/departments/${cacheBuster}`, { headers }).catch(e => ({ error: e })),
        fetch(`/api/shoutouts/?${queryParams.toString()}`, { headers }).catch(e => ({ error: e })),
        fetch(`/api/shoutouts/received${cacheBuster}`, { headers }).catch(e => ({ error: e }))
      ]);

      if (userRes.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const safeJson = async (res) => {
        if (res && res.ok) {
          try { return await res.json(); } catch (e) { return null; }
        }
        return null;
      };

      const [userData, allUsersData, deptData, shoutData, receivedData] = await Promise.all([
        safeJson(userRes),
        safeJson(usersRes),
        safeJson(deptRes),
        safeJson(shoutRes),
        safeJson(receivedRes)
      ]);

      if (userData) {
        setCurrentUserId(userData.id);
        setCurrentUser(userData);
        setCurrentUserDepartment(userData.department);
      }

      if (deptData && Array.isArray(deptData)) {
        setDepartments(deptData);
      }

      if (allUsersData && Array.isArray(allUsersData)) {
        // Filter out self from tagging list if desired, or keep all. 
        // Typically you don't tag yourself.
        const others = userData ? allUsersData.filter(u => u.id !== userData.id) : allUsersData;
        setColleagues(others);
      }

      // Use allUsersData for leaderboard to be complete, not just "others"
      const leaderboardUsers = allUsersData && Array.isArray(allUsersData) ? allUsersData : [];

      const shoutDataList = Array.isArray(shoutData) ? shoutData : [];
      const receivedDataList = Array.isArray(receivedData) ? receivedData : [];



      // Update Stats - Count shoutouts where current user is sender
      const mySentShoutouts = shoutDataList.filter(s => s.sender_id === userData?.id);

      // Update stats with counts
      setStats(prev => [
        { ...prev[0], value: String(mySentShoutouts.length) },
        { ...prev[1], value: String(receivedDataList.length) },
      ]);

      // Leaderboard Logic: Count posts SENT by each user
      const sentCounts = {};
      shoutDataList.forEach(shout => {
        sentCounts[shout.sender_id] = (sentCounts[shout.sender_id] || 0) + 1;
      });

      if (leaderboardUsers.length > 0) {
        const leaderboard = leaderboardUsers.map(col => ({
          ...col,
          bragCount: sentCounts[col.id] || 0
        })).sort((a, b) => b.bragCount - a.bragCount);

        setLeaderboardData(leaderboard);
      }

      // Map Shout-Outs to feed items
      const shoutFeed = shoutDataList.map(shout => {
        // Fix Date: Use actual created_at timestamp
        let createdDate = null;
        let dateString = 'Just now';

        if (shout.created_at) {
          try {
            createdDate = new Date(shout.created_at);
            // Check if date is valid
            if (!isNaN(createdDate.getTime())) {
              dateString = createdDate.toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            }
          } catch (e) {
            console.error('Error parsing date:', e);
          }
        }

        return {
          id: shout.id, // Keep exact ID for delete
          shoutId: shout.id,
          type: 'shoutout',
          senderId: shout.sender_id,
          user: shout.sender?.name || 'Someone',
          action: 'sent a post to',
          item: Array.isArray(shout.recipients) && shout.recipients.length > 0
            ? shout.recipients.map(r => r.recipient?.name || 'Unknown').join(', ')
            : 'Someone',
          message: shout.message,
          title: shout.title,
          image_url: shout.image_url,
          tags: shout.tags,
          time: createdDate ? createdDate.getTime() : Date.now(),
          displayTime: dateString,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${shout.sender_id}`,
          reaction_counts: shout.reaction_counts,
          current_user_reaction: shout.current_user_reaction,
        };
      });

      const combinedFeed = [...shoutFeed].sort((a, b) => b.time - a.time);

      setRecentActivity(combinedFeed);
      setLoading(false);

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      setLoading(false);
    }
  }, [token, navigate, filters]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, navigate, filters]);

  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/shoutouts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData(); // Refresh feed
      } else {
        alert("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post", error);
    }
  };

  const handleReaction = async (shoutoutId, type) => {
    try {
      const response = await fetch(`/api/shoutouts/${shoutoutId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        const updatedShoutout = await response.json();

        // Update specific item in recentActivity without full refetch
        setRecentActivity(prev => prev.map(activity => {
          if (activity.shoutId === shoutoutId) {
            return {
              ...activity,
              reaction_counts: updatedShoutout.reaction_counts,
              current_user_reactions: updatedShoutout.current_user_reactions
            };
          }
          return activity;
        }));
      }
    } catch (error) {
      console.error("Failed to react", error);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-indigo-600 font-bold text-xl animate-pulse">Loading Dashboard...</div>;

  return (
    <div className="space-y-10 animate-fade-in relative pb-10">
      {/* Decorative Cartoons/Icons */}
      <div className="fixed top-20 right-10 text-9xl text-indigo-500/5 rotate-12 -z-10 pointer-events-none animate-float"><FaRocket /></div>
      <div className="fixed bottom-20 left-10 text-9xl text-purple-500/5 -rotate-12 -z-10 pointer-events-none animate-float-delayed"><FaGhost /></div>

      {/* Cartoon Humans / Activity */}
      <div className="fixed top-1/3 left-5 text-8xl text-blue-500/10 -z-10 pointer-events-none animate-bounce-slow">
        <FaRunning />
      </div>
      <div className="fixed bottom-1/3 right-5 text-8xl text-pink-500/10 -z-10 pointer-events-none animate-spin-slow">
        <FaChild />
      </div>
      <div className="fixed top-10 left-1/4 text-6xl text-yellow-500/10 -z-10 pointer-events-none animate-pulse">
        <FaLaptop />
      </div>
      {/* Funny Mascot */}
      <div className="fixed bottom-10 right-10 text-6xl text-yellow-500 z-0 animate-bounce-slow pointer-events-none opacity-20"><FaSmileWink /></div>

      {/* Moving Background Blobs */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight flex items-center gap-3">
            Dashboard <FaSmileWink className="text-yellow-400 text-3xl animate-bounce" />
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
            Welcome back! Recognize your colleagues today.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2 transform hover:-translate-y-0.5 hover-glow"
        >
          <FaPlus /> Create Post
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`group bg-white dark:bg-gray-800 p-1 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover-lift animate-slide-in-bottom ${index === 0 ? 'animation-delay-100' : 'animation-delay-200'}`}
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[1.3rem] h-full relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-500`} />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-4xl font-black text-gray-900 dark:text-white mt-2 transition-all group-hover:scale-110 inline-block">{stat.value}</h3>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white text-2xl shadow-lg ${stat.shadow} animate-bounce-gentle hover-scale`}>
                  {stat.icon}
                </div>
              </div>

              <div
                onClick={() => {
                  if (stat.label === 'Sent') {
                    navigate('/profile', { state: { scrollTo: 'my-posts' } });
                  } else if (stat.label === 'Received') {
                    navigate('/notifications');
                  }
                }}
                className="mt-6 flex items-center gap-2 text-sm font-medium text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all cursor-pointer"
              >
                <span>View Details</span>
                <FaArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div id="feed" className="xl:col-span-2 space-y-8">

          {/* Create Post Section */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex items-center justify-between group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                Have something to share? <FaStar className="text-yellow-300 animate-spin-slow" />
              </h2>
              <p className="text-indigo-100">Recognize a colleague or share a team update.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="relative z-10 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2 hover-glow"
            >
              <FaPlus /> Create Post
            </button>
          </div>

          {showCreateModal && (
            <CreatePostModal
              colleagues={colleagues}
              departments={departments}
              onPostCreated={fetchData}
              onClose={() => setShowCreateModal(false)}
            />
          )}

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Live Feed <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
              </h2>
              <button onClick={() => navigate('/department-feed')} className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline hover-glow px-2 py-1 rounded transition-all">View All</button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase text-gray-400">Department:</label>
                <select
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.departmentId}
                  onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase text-gray-400">Sender:</label>
                <select
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.senderId}
                  onChange={(e) => setFilters({ ...filters, senderId: e.target.value })}
                >
                  <option value="">All Senders</option>
                  {colleagues.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                  {currentUserId && (
                    <option value={currentUserId}>Me</option>
                  )}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase text-gray-400">Date:</label>
                <input
                  type="date"
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
              {(filters.departmentId || filters.senderId || filters.dateFrom || filters.dateTo) && (
                <button
                  onClick={() => setFilters({ departmentId: '', senderId: '', dateFrom: '', dateTo: '' })}
                  className="text-xs font-bold text-red-500 hover:text-red-600 ml-auto"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentActivity.length === 0 ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                  <FaGhost className="text-4xl mb-4 opacity-50" />
                  <p>No activity yet. Be the first to post!</p>
                </div>
              ) : (
                recentActivity.slice(0, 2).map((activity, idx) => (
                  <div
                    key={activity.id}
                    className={`p-6 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/30 group relative animate-fade-in-up hover-glow cursor-pointer ${idx < 3 ? `animation-delay-${(idx + 1) * 100}` : ''}`}
                    onClick={() => setSelectedShoutout(activity)}
                  >
                    {/* Delete Button for Owner */}
                    {activity.senderId === currentUserId && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePost(activity.shoutId); }}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-2"
                        title="Delete Post"
                      >
                        <FaTrash />
                      </button>
                    )}

                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 bg-gradient-to-br from-indigo-600 to-purple-600 transform transition-transform group-hover:scale-110">
                        <span className="text-white font-bold text-lg">
                          {activity.user.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white pb-1">
                          <span className="font-bold">{activity.user}</span>
                          <span className="text-gray-500 dark:text-gray-400 mx-1">{activity.action}</span>
                          <span className="font-bold text-amber-600 dark:text-amber-500">
                            {activity.item}
                          </span>
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 mt-2 space-y-2 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                          {activity.title && <h4 className="font-bold text-indigo-600 dark:text-indigo-400">{activity.title}</h4>}
                          <p className="text-gray-700 dark:text-gray-300 italic">"{activity.message}"</p>

                          {activity.image_url && (
                            <img src={activity.image_url} alt="Post" className="rounded-lg max-h-60 w-full object-cover shadow-sm" />
                          )}

                          {activity.tags && (
                            <div className="flex gap-2 flex-wrap pt-1">
                              {activity.tags.split(',').map((tag, i) => (
                                <span key={i} className="text-xs font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded">
                                  #{tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-400 mt-2 flex items-center gap-1">
                          {activity.displayTime}
                        </p>
                        <div className="mt-4">
                          <ReactionBar counts={activity.reaction_counts} />

                          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-stretch justify-between">
                            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                              <ReactionButton
                                shoutoutId={activity.shoutId}
                                userReactions={activity.current_user_reactions}
                                onReact={handleReaction}
                              />
                            </div>
                            <div className="flex-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleComments(activity.shoutId); }}
                                className="w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
                              >
                                <FaRegCommentDots className="text-xl" />
                                <span className="hidden sm:inline">Comment</span>
                              </button>
                            </div>

                          </div>

                          {activeComments[activity.shoutId] && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <CommentSection shoutoutId={activity.shoutId} currentUser={currentUser} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                ))
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard or Department Focus */}
        <div className="bg-gradient-to-b from-indigo-600 to-purple-700 rounded-3xl shadow-xl text-white p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <FaUsers className="text-yellow-300 text-3xl animate-pulse" />
              <h2 className="text-2xl font-bold">My Team</h2>
            </div>

            <div className="space-y-4">
              {colleagues.length === 0 ? (
                <p className="text-indigo-200">No other colleagues yet.</p>
              ) : (
                (() => {
                  // Filter colleagues by same department
                  const sameDeptColleagues = currentUserDepartment
                    ? colleagues.filter(col => col.department?.id === currentUserDepartment.id)
                    : colleagues;

                  return sameDeptColleagues.length === 0 ? (
                    <p className="text-indigo-200">No team members in your department yet.</p>
                  ) : (
                    sameDeptColleagues.slice(0, 3).map((col, i) => {
                      const bragCount = leaderboardData.find(l => l.id === col.id)?.bragCount || 0;
                      return (
                        <div key={col.id} className={`flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-all hover-lift animate-slide-in-left animation-delay-${(i + 1) * 100}`}>
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                            {col.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold">{col.name}</h4>
                            <p className="text-xs text-indigo-200">{bragCount} {bragCount === 1 ? 'post' : 'posts'}</p>
                          </div>
                        </div>
                      );
                    })
                  );
                })()
              )}
            </div>

            <button
              onClick={() => setShowLeaderboard(true)}
              className="w-full mt-8 py-4 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-0.5"
            >
              View Overall Team Members
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Modal */}
      {
        showLeaderboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => {
            setShowLeaderboard(false);
            setSelectedDepartmentFilter(null);
          }}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600">
                <div className="flex items-center gap-3">
                  <FaTrophy className="text-yellow-300 text-2xl" />
                  <h3 className="text-xl font-bold text-white">Overall Team Members</h3>
                </div>
                <button onClick={() => {
                  setShowLeaderboard(false);
                  setSelectedDepartmentFilter(null);
                }} className="text-white hover:text-gray-200 transition-colors">
                  <FaTimes />
                </button>
              </div>

              {/* Department Filter */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedDepartmentFilter(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedDepartmentFilter === null
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    All Departments
                  </button>
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => setSelectedDepartmentFilter(dept.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedDepartmentFilter === dept.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {(() => {
                  const filteredData = selectedDepartmentFilter
                    ? leaderboardData.filter(m => m.department?.id === selectedDepartmentFilter)
                    : leaderboardData;

                  if (filteredData.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-400">
                        <FaUsers className="text-5xl mx-auto mb-4 opacity-50" />
                        <p>No team members{selectedDepartmentFilter ? ' in this department' : ''} yet</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filteredData.map((member, index) => {
                        return (
                          <div
                            key={member.id}
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${index < 3
                              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 transform hover:scale-[1.02]'
                              : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                          >
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-lg flex-shrink-0">
                              {member.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 dark:text-white truncate">{member.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {member.department?.name || 'No Department'} • {member.email}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                {member.bragCount}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {member.bragCount === 1 ? 'post' : 'posts'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )
      }

      {/* Shoutout Detail Modal */}
      {selectedShoutout && (
        <ShoutoutDetailModal
          shoutout={selectedShoutout}
          currentUser={currentUser}
          onClose={() => setSelectedShoutout(null)}
          onReact={handleReaction}
          onDelete={handleDeletePost}
        />
      )}
    </div >
  );
};

export default Dashboard;
