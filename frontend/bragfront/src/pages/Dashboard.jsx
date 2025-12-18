import React, { useState, useEffect } from 'react';
import { FaTrophy, FaUsers, FaBullhorn, FaPlus, FaArrowRight, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import BragModal from '../components/BragModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'My Posts', value: '0', icon: <FaTrophy />, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/30' },
    { label: 'Dept Posts', value: '0', icon: <FaUsers />, gradient: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/30' },
  ]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [newBrag, setNewBrag] = useState({ title: '', content: '', image_url: '', tags: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedBrag, setSelectedBrag] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const token = localStorage.getItem('token');

  const fetchData = React.useCallback(async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Department Brags
      const deptRes = await fetch('http://localhost:8000/api/brags/department', { headers });

      if (deptRes.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const deptBrags = await deptRes.json();

      // Fetch My Brags
      const myRes = await fetch('http://localhost:8000/api/brags/my-brags', { headers });
      const myBrags = await myRes.json();

      // Fetch Current User
      const userRes = await fetch('http://localhost:8000/api/me', { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUserId(userData.id);
      }

      // Fetch Colleagues
      const colRes = await fetch('http://localhost:8000/api/departments/colleagues', { headers });
      const colleagues = await colRes.json();
      setColleagues(colleagues);

      // Update Stats
      setStats(prev => [
        { ...prev[0], value: myBrags.length || 0 }, // My Brags
        { ...prev[1], value: deptBrags.length || 0 }, // Dept Brags
      ]);

      // Prepare leaderboard data with brag counts
      const bragCounts = {};
      deptBrags.forEach(brag => {
        const userId = brag.user_id;
        bragCounts[userId] = (bragCounts[userId] || 0) + 1;
      });

      const leaderboard = colleagues.map(col => ({
        ...col,
        bragCount: bragCounts[col.id] || 0
      })).sort((a, b) => b.bragCount - a.bragCount);

      setLeaderboardData(leaderboard);

      // Update Recent Activity (using dept brags as feed for now)
      // Just satisfy the schema expected by the UI
      const feed = Array.isArray(deptBrags) ? deptBrags.slice(0, 5).map(brag => ({
        id: brag.id,
        user: brag.author_name || `User #${brag.user_id}`,
        action: 'posted',
        item: brag.title,
        time: new Date(brag.created_at).toLocaleDateString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${brag.user_id}`,
        fullBrag: brag
      })) : [];

      setRecentActivity(feed);
      setLoading(false);

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, navigate, fetchData]);



  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateBrag = async (e) => {
    e.preventDefault();
    try {
      // Convert image to base64 if present
      let imageData = '';
      if (imageFile) {
        const reader = new FileReader();
        imageData = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(imageFile);
        });
      }

      const bragData = {
        ...newBrag,
        image_url: imageData || null
      };

      const res = await fetch('http://localhost:8000/api/brags/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bragData)
      });

      if (res.ok) {
        setShowModal(false);
        setNewBrag({ title: '', content: '', image_url: '', tags: '' });
        setImageFile(null);
        setImagePreview(null);
        fetchData(); // Refresh data
      } else {
        const errorData = await res.json();
        console.error("Server Error:", errorData);
        alert(`Failed to create post: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating brag", error);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-indigo-600 font-bold text-xl">Loading Dashboard...</div>;

  return (
    <div className="space-y-10 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
            Welcome back! Here's what's happening in your department today.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <FaPlus />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="group bg-white dark:bg-gray-800 p-1 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[1.3rem] h-full relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-4xl font-black text-gray-900 dark:text-white mt-2">{stat.value}</h3>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white text-2xl shadow-lg ${stat.shadow}`}>
                  {stat.icon}
                </div>
              </div>

              <div
                onClick={() => {
                  if (stat.label === 'My Posts') navigate('/profile', { state: { scrollTo: 'my-posts' } });
                  else if (stat.label === 'Dept Posts') navigate('/department-feed');
                }}
                className="mt-6 flex items-center gap-2 text-sm font-medium text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <FaArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div id="feed" className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Feed (Department)</h2>
            <button onClick={() => navigate('/department-feed')} className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No activity yet. Be the first to post!</div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  onClick={() => setSelectedBrag(activity.fullBrag || null)}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {activity.user.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white pb-1">
                        <span className="font-bold">{activity.user}</span>
                        <span className="text-gray-500 dark:text-gray-400 mx-1">{activity.action}</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">"{activity.item}"</span>
                      </p>
                      <p className="text-xs font-semibold text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Leaderboard or Department Focus */}
        <div className="bg-gradient-to-b from-indigo-600 to-purple-700 rounded-3xl shadow-xl text-white p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <FaUsers className="text-yellow-300 text-3xl" />
              <h2 className="text-2xl font-bold">My Team</h2>
            </div>

            <div className="space-y-4">
              {colleagues.length === 0 ? (
                <p className="text-indigo-200">No other colleagues yet.</p>
              ) : (
                colleagues.slice(0, 3).map((col, i) => {
                  const bragCount = leaderboardData.find(l => l.id === col.id)?.bragCount || 0;
                  return (
                    <div key={col.id} className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-colors">
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
              )}
            </div>

            <button
              onClick={() => setShowLeaderboard(true)}
              className="w-full mt-8 py-4 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-0.5"
            >
              View All Team Members
            </button>
          </div>
        </div>
      </div>

      {/* Create Brag Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Post</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateBrag} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  maxLength="100"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="What did you achieve?"
                  value={newBrag.title}
                  onChange={(e) => setNewBrag({ ...newBrag, title: e.target.value })}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Details *</label>
                  <span className="text-xs text-gray-400">{newBrag.content.length}/500</span>
                </div>
                <textarea
                  required
                  rows="4"
                  maxLength="500"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Tell us more about your achievement..."
                  value={newBrag.content}
                  onChange={(e) => setNewBrag({ ...newBrag, content: e.target.value })}
                />
              </div>

              {/* Tag Colleagues Section */}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Photo <span className="text-gray-400 text-xs">(optional)</span>
                </label>

                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-gray-50 dark:bg-gray-700/30">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Achievement', 'Milestone', 'Project', 'Award', 'Learning', 'Teamwork'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const currentTags = newBrag.tags ? newBrag.tags.split(',') : [];
                        if (currentTags.includes(tag)) {
                          setNewBrag({ ...newBrag, tags: currentTags.filter(t => t !== tag).join(',') });
                        } else {
                          setNewBrag({ ...newBrag, tags: [...currentTags, tag].join(',') });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${newBrag.tags?.split(',').includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5">
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="flex items-center gap-3">
                <FaTrophy className="text-yellow-300 text-2xl" />
                <h3 className="text-xl font-bold text-white">Department Rankings</h3>
              </div>
              <button onClick={() => setShowLeaderboard(false)} className="text-white hover:text-gray-200 transition-colors">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {leaderboardData.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaUsers className="text-5xl mx-auto mb-4 opacity-50" />
                  <p>No team members yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboardData.map((member, index) => {
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${index < 3
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700'
                          : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                          }`}
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-lg flex-shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate">{member.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
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
              )}
            </div>
          </div>
        </div>
      )}

      <BragModal
        brag={selectedBrag}
        onClose={() => setSelectedBrag(null)}
        currentUserId={currentUserId}
        onUpdate={() => fetchData()}
      />
    </div>
  );
};

export default Dashboard;
