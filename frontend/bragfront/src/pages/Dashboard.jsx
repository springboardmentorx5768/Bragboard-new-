import React, { useState, useEffect } from 'react';
import { FaTrophy, FaUsers, FaBullhorn, FaPlus, FaArrowRight, FaTimes } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import BragModal from '../components/BragModal';
import ShoutoutForm from '../components/ShoutoutForm';
import ShoutoutCard from '../components/ShoutoutCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState([
    { label: 'My Brags', value: '0', icon: <FaTrophy /> },
    { label: 'Dept Brags', value: '0', icon: <FaUsers /> },
  ]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [newBrag, setNewBrag] = useState({ title: '', content: '', image_url: '', video_url: '', tags: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedBrag, setSelectedBrag] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [shoutouts, setShoutouts] = useState([]);

  const token = localStorage.getItem('token');

  const fetchData = React.useCallback(async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const deptRes = await fetch('http://localhost:8000/api/brags/department', { headers });
      if (deptRes.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      const deptBrags = await deptRes.json();
      const myRes = await fetch('http://localhost:8000/api/brags/my-brags', { headers });
      const myBrags = await myRes.json();
      const userRes = await fetch('http://localhost:8000/api/me', { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUserId(userData.id);
      }
      const colRes = await fetch('http://localhost:8000/api/departments/colleagues', { headers });
      const colleagues = await colRes.json();
      setColleagues(colleagues);

      setStats([
        { label: 'My Brags', value: myBrags.length || 0, icon: <FaTrophy /> },
        { label: 'Dept Brags', value: deptBrags.length || 0, icon: <FaUsers /> },
      ]);

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

      const feed = Array.isArray(deptBrags) ? deptBrags.slice(0, 5).map(brag => ({
        id: brag.id,
        user: brag.author_name || `User #${brag.user_id}`,
        item: brag.title,
        time: new Date(brag.created_at).toLocaleDateString(),
        fullBrag: brag
      })) : [];
      setRecentActivity(feed);

      const shoutoutRes = await fetch('http://localhost:8000/api/shoutouts/me', { headers });
      if (shoutoutRes.ok) {
        const shoutoutData = await shoutoutRes.json();
        setShoutouts(shoutoutData);
      }
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

  useEffect(() => {
    if (!loading && shoutouts.length > 0) {
      const params = new URLSearchParams(location.search);
      const shoutoutId = params.get('shoutoutId');
      if (shoutoutId) {
        setTimeout(() => {
          const element = document.getElementById(`shoutout-${shoutoutId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('lumina-glow');
          }
        }, 500);
      }
    }
  }, [loading, shoutouts, location.search]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('Video size should be less than 20MB');
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleCreateBrag = async (e) => {
    e.preventDefault();
    // Requirements removed as per user request


    setSubmitting(true);
    try {
      const readFileAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const imageData = imageFile ? await readFileAsBase64(imageFile) : null;
      const videoData = videoFile ? await readFileAsBase64(videoFile) : null;

      const res = await fetch('http://localhost:8000/api/brags/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newBrag,
          image_url: imageData,
          video_url: videoData
        })
      });
      if (res.ok) {
        setShowModal(false);
        setNewBrag({ title: '', content: '', image_url: '', video_url: '', tags: '' });
        setImageFile(null);
        setImagePreview(null);
        setVideoFile(null);
        setVideoPreview(null);
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Failed to create brag: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating brag", error);
      alert("An error occurred while uploading. Please check file sizes.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShoutout = async (shoutoutId) => {
    if (!window.confirm("Are you sure you want to delete this shout-out?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/shoutouts/${shoutoutId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Failed to delete: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting shout-out", error);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-brand-dark">
      <div className="w-20 h-20 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin shadow-[0_0_20px_rgba(34,211,238,0.2)]" />
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in relative">

      {/* Hero Section */}
      <div className="relative lumina-card p-12 overflow-hidden group animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-brand-dark to-brand-secondary/20 opacity-50" />
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-brand-secondary/10 rounded-full blur-[100px] animate-pulse delay-700" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="max-w-xl space-y-6">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
              Welcome to Your <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">Dashboard</span>
            </h1>
            <div className="pt-4">
              <button
                onClick={() => setShowModal(true)}
                className="group relative px-10 py-5 bg-brand-dark text-white dark:bg-white dark:text-brand-dark rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 lumina-glow overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-secondary opacity-0 group-hover:opacity-10 dark:group-hover:opacity-10 transition-opacity" />
                <span className="relative flex items-center gap-3">
                  <FaPlus /> Post a Brag
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (stat.label === 'My Brags') {
                    navigate('/profile', { state: { scrollTo: 'my-posts' } });
                  } else if (stat.label === 'Dept Brags') {
                    navigate('/department-feed');
                  }
                }}
                className={`lumina-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group/metric cursor-pointer ${idx === 0 ? 'animate-slide-up delay-100' : 'animate-slide-up delay-150'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-brand-primary text-2xl mb-4 border border-black/5 dark:border-white/5 shadow-inner">
                  {stat.icon}
                </div>
                <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tighter">{stat.value}</div>
                <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 lumina-card flex flex-col h-[600px] animate-slide-up delay-200">
          <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Brags</h2>
                <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Latest Updates</p>
              </div>
            </div>
            <button onClick={() => navigate('/department-feed')} className="px-5 py-2.5 lumina-glass rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/10 transition-all">
              View All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-900 dark:text-white italic space-y-4">
                <FaBullhorn className="text-4xl opacity-20" />
                <p>No brags posted yet.</p>
              </div>
            ) : (
              recentActivity.map((activity, idx) => (
                <div
                  key={activity.id}
                  onClick={() => setSelectedBrag(activity.fullBrag || null)}
                  className={`p-6 lumina-glass rounded-3xl border border-white/5 hover:border-brand-primary/20 transition-all cursor-pointer group flex gap-6 items-center animate-slide-up`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-slate-900 dark:text-white font-black text-xl shadow-inner border border-white/10 group-hover:scale-110 transition-transform">
                      {activity.user.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-primary rounded-full border-2 border-brand-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-white font-bold mb-1 text-sm">
                      {activity.user} <span className="text-slate-900 dark:text-white font-medium lowercase">posted a brag</span>
                    </p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors truncate">
                      "{activity.item}"
                    </h3>
                  </div>
                  <div className="text-[10px] font-black text-slate-900 dark:text-white dark:text-slate-900 dark:text-white/90 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                    {activity.time}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8 animate-slide-up delay-300">
          <div className="lumina-card p-1">
            <div className="p-8 bg-white/[0.02] rounded-[1.8rem]">
              <ShoutoutForm
                colleagues={colleagues}
                onShoutoutCreated={fetchData}
                compact={true}
              />
            </div>
          </div>

          <div className="lumina-card p-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/5 rounded-full blur-3xl opacity-50 dark:opacity-100" />
            <div className="p-8 bg-black/[0.01] dark:bg-white/[0.02] rounded-[1.8rem]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <FaTrophy className="text-brand-primary drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  Top Braggers
                </h2>
              </div>
              <div className="space-y-4">
                {leaderboardData.slice(0, 3).map((col, i) => (
                  <div key={col.id} className="flex items-center gap-4 p-4 lumina-glass rounded-2xl border border-white/5 hover:border-brand-primary/20 transition-all hover:-translate-x-1 group/item">
                    <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center font-black text-brand-primary text-lg border border-black/5 dark:border-white/10">
                      {col.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-900 dark:text-white truncate text-sm">{col.name}</h4>
                      <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">{col.bragCount} BRAGS</p>
                    </div>
                    {i === 0 && <div className="w-2 h-2 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(34,211,238,1)] animate-pulse" />}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-full mt-8 py-4 lumina-glass text-brand-primary font-black rounded-2xl text-[10px] uppercase tracking-widest border border-brand-primary/20 hover:bg-brand-primary/10 transition-all"
              >
                Full Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-8 animate-slide-up delay-500">
        <div className="flex items-center gap-4 px-2">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Recent Shout-outs</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-black/5 dark:from-white/10 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
          {shoutouts.slice(0, 3).map(shoutout => (
            <div key={shoutout.id} className="transform transition-all duration-500 hover:-translate-y-4">
              <ShoutoutCard
                shoutout={shoutout}
                currentUserId={currentUserId}
                onDelete={handleDeleteShoutout}
                colleagues={colleagues}
                onUpdate={fetchData}
              />
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-xl animate-fade-in">
          <div className="lumina-card w-full max-w-md overflow-hidden relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Post a Brag</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-slate-900 dark:text-white hover:text-slate-900 dark:text-white transition-colors">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateBrag} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[10px] font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">Title</label>
                <input
                  type="text"
                  className="w-full px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.03] text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all placeholder:text-slate-900 dark:text-white/90"
                  placeholder="What did you achieve?"
                  value={newBrag.title}
                  onChange={(e) => setNewBrag({ ...newBrag, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">Description</label>
                <textarea
                  rows="3"
                  className="w-full px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.03] text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all resize-none placeholder:text-slate-900 dark:text-white/90"
                  placeholder="Tell us more about it..."
                  value={newBrag.content}
                  onChange={(e) => setNewBrag({ ...newBrag, content: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">Photo</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-900 dark:text-white">
                        <FaPlus className="mb-2" />
                        <span className="text-[10px] font-bold">IMAGE</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">Video</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden">
                    {videoPreview ? (
                      <video src={videoPreview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-900 dark:text-white">
                        <FaPlus className="mb-2" />
                        <span className="text-[10px] font-bold">VIDEO</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="video/*" onChange={handleVideoChange} />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-white text-brand-dark font-black rounded-2xl text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] lumina-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Transmitting Spark...' : 'Submit Brag'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-xl animate-fade-in">
          <div className="lumina-card w-full max-w-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20">
              <div className="flex items-center gap-4">
                <FaTrophy className="text-brand-primary text-3xl drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Leaderboard</h3>
              </div>
              <button onClick={() => setShowLeaderboard(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-slate-900 dark:text-white hover:bg-white/10 transition-all">
                <FaTimes />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
              {leaderboardData.map((member, index) => (
                <div key={member.id} className="flex items-center gap-6 p-6 lumina-glass rounded-3xl border border-white/5 hover:border-brand-primary/10 transition-all group">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 ${index === 0 ? 'border-brand-primary shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-brand-primary/10' : 'border-white/5 bg-white/5 text-slate-900 dark:text-white'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-900 dark:text-white text-lg truncate mb-1">{member.name}</h4>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{member.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-brand-primary">{member.bragCount}</div>
                    <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Brags</div>
                  </div>
                </div>
              ))}
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
