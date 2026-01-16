import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, CheckCircle, XCircle, Layout, LogOut, User, Mail, Briefcase, BadgeCheck, 
  Send, Calendar, MessageSquare, Clock, ArrowRight, Filter, 
  Trash2, Eye, Sun, Moon, Link, Upload, Hash, Shield, Bell,
  ThumbsUp, HandMetal, Star, MessageCircle, AlertTriangle, BarChart, Download,
  X 
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';
const DEPARTMENTS = ["Engineering", "Sales", "Finance"];

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('bragboard_token'));
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'admin'>('dashboard');
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [feed, setFeed] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState('All');
  
  const [adminStats, setAdminStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);

  const [shoutoutMsg, setShoutoutMsg] = useState('');
  const [mediaType, setMediaType] = useState<'link' | 'upload'>('link');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [taggedUserIds, setTaggedUserIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentInputs, setCommentInputs] = useState<{[key: number]: string}>({});

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [role, setRole] = useState('employee');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [uRes, usersRes, notifRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (uRes.ok) {
        setUser(await uRes.json());
      } else logout();
      if (usersRes.ok) setActiveUsers(await usersRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
    } catch (e) { console.error("Error fetching data:", e); }
  }, [token]);

  const fetchFeed = useCallback(async () => {
    if (!token) return;
    try {
      let url = `${API_BASE_URL}/shoutouts?`;
      if (filterDept !== 'All') url += `department=${filterDept}&`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFeed(await res.json());
    } catch (e) { console.error("Feed error:", e); }
  }, [token, filterDept]);

  const fetchAdminData = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/admin/reports`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (statsRes.ok) setAdminStats(await statsRes.json());
      if (reportsRes.ok) setReports(await reportsRes.json());
    } catch (e) { console.error(e); }
  }, [token, user]);

  useEffect(() => { if (token) { fetchData(); fetchFeed(); } }, [token, fetchData, fetchFeed]);
  useEffect(() => { if (currentView === 'admin') fetchAdminData(); }, [currentView, fetchAdminData]);

  const logout = () => {
    setUser(null); setToken(null); localStorage.removeItem('bragboard_token');
    setMessage({ type: 'success', text: "Logged out successfully" });
  };

  const handlePostShoutout = async () => {
    if (!shoutoutMsg.trim()) return setMessage({ type: 'error', text: 'Message required' });
    if (taggedUserIds.length === 0) return setMessage({ type: 'error', text: 'Tag a teammate!' });
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("message", shoutoutMsg);
      formData.append("recipient_ids", taggedUserIds.join(","));
      if (mediaType === "link" && mediaUrlInput) formData.append("media_url", mediaUrlInput);
      else if (mediaType === "upload" && mediaFile) formData.append("file", mediaFile);

      const res = await fetch(`${API_BASE_URL}/shoutouts`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Shoutout posted!" });
        setShoutoutMsg(""); setMediaUrlInput(""); setMediaFile(null); setTaggedUserIds([]);
        if(fileInputRef.current) fileInputRef.current.value = "";
        fetchFeed(); fetchData();
      } else setMessage({ type: "error", text: "Failed posting!" });
    } catch (e) { setMessage({ type: "error", text: "Connection error" }); } 
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/shoutouts/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setMessage({ type: "success", text: "Deleted" }); fetchFeed(); fetchData(); fetchAdminData(); }
    } catch (e) { setMessage({ type: "error", text: "Delete failed" }); }
  };

  const handleReact = async (id: number, type: string) => {
    await fetch(`${API_BASE_URL}/shoutouts/${id}/react`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ type }) });
    fetchFeed();
  };

  const handleComment = async (id: number) => {
    const content = commentInputs[id];
    if (!content?.trim()) return;
    await fetch(`${API_BASE_URL}/shoutouts/${id}/comments`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ content }) });
    setCommentInputs({ ...commentInputs, [id]: '' });
    fetchFeed();
  };

  const handleReport = async (id: number) => {
    const reason = prompt("Reason for reporting?");
    if (!reason) return;
    try {
      await fetch(`${API_BASE_URL}/shoutouts/${id}/report`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason }) });
      setMessage({type: "success", text: "Reported to Admin."});
    } catch (e) { console.error(e); }
  };

  const handleExport = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/export`, { headers: { Authorization: `Bearer ${token}` } });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = "shoutouts_report.csv";
        a.click();
    } catch (e) { setMessage({type:'error', text:'Export failed'}); }
  };

  const handleMarkSeen = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/shoutouts/${id}/seen`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setCurrentView("dashboard");
      setTimeout(() => document.getElementById(`post-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    } catch (e) { }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const url = isRegister ? `${API_BASE_URL}/register` : `${API_BASE_URL}/token`;
      const body = isRegister ? JSON.stringify({ name, email, password, department, role }) : new URLSearchParams({ username: email, password }).toString();
      const headers = isRegister ? { "Content-Type": "application/json" } : { "Content-Type": "application/x-www-form-urlencoded" };
      const res = await fetch(url, { method: "POST", headers, body });
      if (res.ok) {
        if (isRegister) { setMessage({ type: "success", text: "Registered! Please login." }); setIsRegister(false); }
        else { const data = await res.json(); setToken(data.access_token); localStorage.setItem("bragboard_token", data.access_token); setMessage(null); }
      } else setMessage({ type: "error", text: "Auth failed" });
    } catch (e) { setMessage({ type: "error", text: "Connection error" }); } finally { setIsLoading(false); }
  };

  const getReactionCount = (post: any, type: string) => post.reactions?.filter((r: any) => r.type === type).length || 0;
  const hasReacted = (post: any, type: string) => post.reactions?.some((r: any) => r.type === type && r.user_id === user.id);
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const bg = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800';
  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const input = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900';
  const textMain = darkMode ? 'text-white' : 'text-gray-900';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-600';

  if (token && user) {
    return (
      <div className={`min-h-screen ${bg} flex font-sans transition-colors duration-300`}>
        <aside className={`${darkMode ? 'bg-gray-900 border-r border-gray-800' : 'bg-teal-900'} w-72 text-white flex flex-col sticky top-0 h-screen overflow-y-auto z-10 shadow-2xl`}>
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center"><Zap className="w-7 h-7 text-teal-400 mr-2" /><span className="text-2xl font-black tracking-tighter">BragBoard</span></div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 rounded-full hover:bg-white/10 transition">{darkMode ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5 text-teal-200" />}</button>
          </div>
          <nav className="p-6 space-y-3">
            <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center p-4 rounded-xl transition ${currentView === 'dashboard' ? 'bg-white/20 shadow-inner font-bold' : 'hover:bg-white/5'}`}><Layout className="w-5 mr-3" />Dashboard</button>
            <button onClick={() => setCurrentView('profile')} className={`w-full flex items-center p-4 rounded-xl transition ${currentView === 'profile' ? 'bg-white/20 shadow-inner font-bold' : 'hover:bg-white/5'}`}><User className="w-5 mr-3" />My Profile</button>
            {user.role === 'admin' && <button onClick={() => setCurrentView('admin')} className={`w-full flex items-center p-4 rounded-xl transition ${currentView === 'admin' ? 'bg-white/20 shadow-inner font-bold' : 'hover:bg-white/5'}`}><Shield className="w-5 mr-3" />Admin Panel</button>}
          </nav>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between text-xs font-black uppercase text-teal-400 mb-4 tracking-widest"><div className="flex items-center"><Bell className="w-3 h-3 mr-2" /><span>Notifications</span></div>{notifications.length > 0 && <span className="bg-red-500 text-white px-2 rounded-full">{notifications.length}</span>}</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">{notifications.length === 0 ? (<div className="text-xs text-white/30 italic">No new notifications</div>) : (notifications.map(n => (<div key={n.id} onClick={() => handleMarkSeen(n.id)} className="bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition"><div className="text-xs font-bold text-teal-300">{n.sender.name}</div><div className="text-[10px] text-white/70 truncate">sent you a shoutout!</div></div>)))}</div>
          </div>
          <div className="mt-auto p-6 border-t border-white/10 bg-black/10">
            <div className="flex items-center space-x-3 mb-4"><div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-2xl font-black">{user.name.charAt(0).toUpperCase()}</div><div className="overflow-hidden"><p className="text-sm font-bold truncate">{user.name}</p><p className="text-[10px] uppercase font-bold text-teal-400">{user.department}</p></div></div>
            <button onClick={logout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-xl flex items-center justify-center transition shadow-md"><LogOut className="w-4 h-4" /><span>Sign Out</span></button>
          </div>
        </aside>

        <main className="flex-1 p-10 overflow-y-auto">
          {message && <div className={`mb-8 p-5 rounded-2xl flex items-center shadow-lg ${message.type === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>{message.type === 'success' ? <CheckCircle className="w-6 mr-3" /> : <XCircle className="w-6 mr-3" />}<span className="font-bold">{message.text}</span><button className="ml-auto hover:scale-110 transition" onClick={() => setMessage(null)}><X className="w-5 h-5"/></button></div>}

          {currentView === 'dashboard' ? (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
              <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div><h1 className={`text-4xl font-black tracking-tight ${textMain}`}>Company Feed</h1><p className={`${textSub} font-bold`}>Celebrate wins!</p></div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border shadow-sm ${card}`}><Filter className={`w-4 h-4 ${textSub}`} /><span className={`text-sm font-bold ${textSub}`}>Dept:</span><select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className={`bg-transparent text-sm font-bold outline-none cursor-pointer ${textMain}`}><option value="All">All</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              </header>
              <div className={`rounded-xl shadow-sm border p-6 mb-8 transition-all ${card}`}>
                <textarea value={shoutoutMsg} onChange={(e) => setShoutoutMsg(e.target.value)} placeholder={`What's the good news, ${user.name.split(' ')[0]}?`} className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none min-h-[80px] mb-3 resize-none font-medium ${input}`} />
                <div className="flex items-center space-x-4 mb-4"><button onClick={() => setMediaType('link')} className={`text-xs font-bold uppercase flex items-center space-x-1 ${mediaType === 'link' ? 'text-teal-600' : 'opacity-40 hover:opacity-100'}`}><Link className="w-3 h-3"/><span>Link</span></button><button onClick={() => setMediaType('upload')} className={`text-xs font-bold uppercase flex items-center space-x-1 ${mediaType === 'upload' ? 'text-teal-600' : 'opacity-40 hover:opacity-100'}`}><Upload className="w-3 h-3"/><span>Upload</span></button></div>
                {mediaType === 'link' ? <input type="text" value={mediaUrlInput} onChange={(e) => setMediaUrlInput(e.target.value)} placeholder="Paste URL" className={`w-full p-2 mb-4 text-sm border rounded-lg focus:ring-1 focus:ring-teal-500 outline-none ${input}`} /> : <input type="file" ref={fileInputRef} onChange={(e) => setMediaFile(e.target.files ? e.target.files[0] : null)} accept="image/*,video/*" className={`w-full p-2 mb-4 text-sm border rounded-lg outline-none ${input}`} />}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-wrap gap-2 items-center"><span className={`text-xs font-bold uppercase mr-2 tracking-widest ${textSub}`}>Tag:</span>{activeUsers.filter(u => u.id !== user.id).map(u => (<button key={u.id} onClick={() => setTaggedUserIds(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])} className={`px-3 py-1 rounded-full text-xs font-medium flex items-center border transition ${taggedUserIds.includes(u.id) ? 'bg-teal-600 text-white border-teal-700' : `${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200 text-gray-800'}`}`}>{u.name} <span className="ml-1 opacity-70 text-[9px]">({u.department})</span>{taggedUserIds.includes(u.id) && <CheckCircle className="w-3 h-3 ml-1 fill-white text-teal-600" />}</button>))}</div>
                  <button onClick={handlePostShoutout} disabled={isLoading} className="w-full md:w-auto px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"><Send className="w-4 h-4 inline mr-2" />Post</button>
                </div>
              </div>
              <div className="space-y-6 pb-20">
                {feed.map((post: any) => (
                  <div key={post.id} id={`post-${post.id}`} className={`rounded-2xl shadow-sm border p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${card}`}>
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-md">{post.sender.name.charAt(0).toUpperCase()}</div>
                        <div><div className={`font-bold text-lg ${textMain}`}>{post.sender.name} <span className={`font-normal text-sm ml-1 ${textSub}`}>({post.sender.department})</span></div><div className={`text-xs flex items-center mt-0.5 ${textSub}`}><Clock className="w-3 h-3 mr-1" />{formatDate(post.created_at)}</div></div>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleReport(post.id)} className="p-2 text-gray-400 hover:text-orange-500" title="Report"><AlertTriangle className="w-4 h-4"/></button>
                        {(post.sender.id === user.id || user.role === 'admin') && <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition"><Trash2 className="w-5 h-5" /></button>}
                      </div>
                    </div>
                    <p className={`text-lg mb-6 leading-relaxed font-medium ${textMain}`}>{post.message}</p>
                    {post.image_url && (<div className="mb-6 rounded-2xl overflow-hidden border border-gray-200/20 bg-black/5 flex justify-center">{post.image_url.match(/\.(mp4|webm|mov|ogg)($|\?)/i) ? <video src={post.image_url} controls className="w-full max-h-[500px] object-contain bg-black" /> : <img src={post.image_url} alt="Media" className="w-full max-h-[500px] object-contain" onError={(e) => {console.error("Image load fail", post.image_url)}}/>}</div>)}
                    <div className="flex space-x-4 mb-4 pt-2">
                        <button onClick={() => handleReact(post.id, 'like')} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition ${hasReacted(post, 'like') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}><ThumbsUp className={`w-4 h-4 ${hasReacted(post, 'like') ? 'fill-blue-600 dark:fill-blue-300' : ''}`} /><span className="text-xs font-bold">{getReactionCount(post, 'like') || ''}</span></button>
                        <button onClick={() => handleReact(post.id, 'clap')} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition ${hasReacted(post, 'clap') ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}><HandMetal className={`w-4 h-4 ${hasReacted(post, 'clap') ? 'fill-yellow-600 dark:fill-yellow-300' : ''}`} /><span className="text-xs font-bold">{getReactionCount(post, 'clap') || ''}</span></button>
                        <button onClick={() => handleReact(post.id, 'star')} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition ${hasReacted(post, 'star') ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}><Star className={`w-4 h-4 ${hasReacted(post, 'star') ? 'fill-purple-600 dark:fill-purple-300' : ''}`} /><span className="text-xs font-bold">{getReactionCount(post, 'star') || ''}</span></button>
                    </div>
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                      {post.comments?.length > 0 && <div className="space-y-3 mb-4">{post.comments.map((c: any) => (<div key={c.id} className="flex gap-2"><div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-800 flex-shrink-0">{c.user.name.charAt(0)}</div><div className="text-sm"><span className="font-bold mr-2">{c.user.name}</span><span className={textMain}>{c.content}</span></div></div>))}</div>}
                      <div className="flex items-center gap-2"><input type="text" placeholder="Add a comment..." className={`flex-1 p-2 text-sm rounded-lg border ${input}`} value={commentInputs[post.id] || ''} onChange={e => setCommentInputs({...commentInputs, [post.id]: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleComment(post.id)} /><button onClick={() => handleComment(post.id)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"><MessageCircle className="w-4 h-4"/></button></div>
                    </div>
                    <div className="flex items-center text-sm pt-4 border-t border-gray-100 dark:border-gray-700 mt-4"><span className={`font-bold mr-3 flex items-center text-teal-600 dark:text-teal-400`}><ArrowRight className="w-4 h-4 mr-1"/> Recipients:</span><div className="flex flex-wrap gap-2">{post.recipients.map((r: any, idx: number) => (<span key={idx} className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${darkMode ? 'bg-teal-500/10 text-teal-300' : 'bg-teal-50 text-teal-700'}`}><span>{r.recipient.name}</span><span title={r.is_seen ? "Seen" : "Unseen"}>{r.is_seen ? <Eye className="w-3.5 h-3.5 text-blue-500" /> : <span className="w-2 h-2 rounded-full bg-gray-400/50"></span>}</span></span>))}</div></div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentView === 'admin' ? (
            <div className="max-w-5xl mx-auto">
              <header className="mb-8 flex justify-between items-center"><div><h1 className={`text-4xl font-black ${textMain}`}>Admin Panel</h1><p className={textSub}>Moderation & Analytics</p></div><button onClick={handleExport} className="flex items-center space-x-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold shadow-lg hover:bg-teal-700"><Download className="w-4 mr-2"/>Export CSV</button></header>
              {adminStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className={`p-6 rounded-3xl border shadow-sm ${card}`}><BarChart className="w-6 h-6 text-teal-500 mb-3" /><p className="text-xs uppercase font-bold opacity-50">Total Shoutouts</p><p className={`text-3xl font-black ${textMain}`}>{adminStats.total_shoutouts}</p></div>
                  <div className={`p-6 rounded-3xl border shadow-sm ${card}`}><p className="text-xs uppercase font-bold opacity-50">Total Users</p><p className={`text-3xl font-black ${textMain}`}>{adminStats.total_users}</p></div>
                  <div className={`p-6 rounded-3xl border shadow-sm col-span-2 ${card}`}><p className="text-xs uppercase font-bold opacity-50 mb-3">Top Contributor</p><div className="flex items-center"><div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-700 mr-3">{adminStats.top_contributors[0]?.name.charAt(0)}</div><div><p className={`font-bold ${textMain}`}>{adminStats.top_contributors[0]?.name || "N/A"}</p><p className="text-xs opacity-60">{adminStats.top_contributors[0]?.count || 0} posts</p></div></div></div>
                </div>
              )}
              <h2 className={`text-2xl font-bold mb-4 ${textMain}`}>Reported Content</h2>
              <div className="space-y-4 pb-20">{reports.length === 0 ? <p className="opacity-50 italic">No active reports.</p> : reports.map((rep: any) => (<div key={rep.id} className={`p-4 rounded-xl border ${card}`}><div className="flex justify-between"><span className="font-bold text-red-500 flex items-center"><AlertTriangle className="w-4 mr-2"/>Report: {rep.reason}</span><span className="text-xs opacity-50">{formatDate(rep.created_at)}</span></div><p className={`mt-2 ${textMain}`}>Post by {rep.shoutout.sender.name}: "{rep.shoutout.message}"</p><button onClick={() => handleDelete(rep.shoutout.id)} className="mt-3 text-xs bg-red-600 text-white px-3 py-1 rounded">Delete Post</button></div>))}</div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto animate-in slide-in-from-right-10 duration-500">
              <header className="mb-8"><div><h1 className={`text-3xl font-bold ${textMain}`}>My Profile</h1></div></header>
              <div className={`rounded-3xl shadow-sm border overflow-hidden mb-8 ${card}`}>
                <div className="bg-gradient-to-r from-teal-600 to-teal-400 h-32 relative"><div className="absolute -bottom-14 left-10"><div className={`w-28 h-28 rounded-full p-1.5 shadow-2xl ${card}`}><div className="w-full h-full rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-4xl font-black">{user.name.charAt(0).toUpperCase()}</div></div></div></div>
                <div className="pt-20 pb-10 px-10">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between"><h2 className={`text-3xl font-black ${textMain}`}>{user.name}</h2><span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${darkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-800'}`}>{user.role}</span></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className={`flex items-center p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}><Hash className="w-5 h-5 text-teal-500 mr-4"/><div><p className={`text-[10px] font-bold uppercase opacity-50 tracking-widest ${textSub}`}>User ID</p><p className={`font-semibold ${textMain}`}>#{user.id}</p></div></div>
                        <div className={`flex items-center p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}><Mail className="w-5 h-5 text-teal-500 mr-4"/><div><p className={`text-[10px] font-bold uppercase opacity-50 tracking-widest ${textSub}`}>Email</p><p className={`font-semibold ${textMain}`}>{user.email}</p></div></div>
                        <div className={`flex items-center p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}><Briefcase className="w-5 h-5 text-teal-500 mr-4"/><div><p className={`text-[10px] font-bold uppercase opacity-50 tracking-widest ${textSub}`}>Department</p><p className={`font-semibold ${textMain}`}>{user.department}</p></div></div>
                        <div className={`flex items-center p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}><Shield className="w-5 h-5 text-teal-500 mr-4"/><div><p className={`text-[10px] font-bold uppercase opacity-50 tracking-widest ${textSub}`}>Role</p><p className={`font-semibold ${textMain} capitalize`}>{user.role}</p></div></div>
                        <div className={`flex items-center p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}><Calendar className="w-5 h-5 text-teal-500 mr-4"/><div><p className={`text-[10px] font-bold uppercase opacity-50 tracking-widest ${textSub}`}>Joined On</p><p className={`font-semibold ${textMain}`}>{new Date(user.joined_at).toLocaleDateString()}</p></div></div>
                        <div className={`flex items-center p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}><BadgeCheck className="w-5 h-5 text-green-500 mr-4"/><div><p className={`text-[10px] font-bold uppercase opacity-50 tracking-widest ${textSub}`}>Status</p><p className="font-semibold text-green-600 dark:text-green-400">Active</p></div></div>
                      </div>
                    </div>
                </div>
              </div>
              <div className={`rounded-2xl shadow-sm border p-6 ${card}`}>
                <h3 className="text-xl font-bold mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-teal-500"/> Sent Shoutouts</h3>
                <div className="space-y-4">{user.shoutouts_sent?.map((s: any) => (
                  <div key={s.id} className={`p-4 rounded-lg border transition ${darkMode ? 'bg-white/5 border-white/10 hover:border-teal-500/50' : 'bg-gray-50 border-gray-100 hover:border-teal-200'}`}>
                    <div className="flex justify-between items-start mb-2"><div className="flex items-center space-x-2 text-sm opacity-60"><Clock className="w-3 h-3"/><span>{formatDate(s.created_at)}</span></div><div className="flex items-center space-x-3"><div className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full ${darkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-800'}`}><ArrowRight className="w-3 h-3" /><span>To: {s.recipients?.map((r: any) => r.recipient.name).join(', ')}</span></div><button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4"/></button></div></div>
                    <p className="opacity-90 text-sm leading-relaxed">"{s.message}"</p>
                  </div>
                ))}</div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-sans text-white">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/20 p-12">
        <header className="text-center mb-10"><h1 className="text-5xl font-black tracking-tighter mb-2 italic">BragBoard</h1><p className="text-teal-400 uppercase tracking-widest text-[10px] font-black">Internal Recognition Platform</p></header>
        <div className="flex bg-black/30 rounded-2xl p-1.5 mb-8 border border-white/5">
          <button onClick={() => {setIsRegister(false); setMessage(null);}} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${!isRegister ? 'bg-teal-500 text-white shadow-xl' : 'text-white/40'}`}>Sign In</button>
          <button onClick={() => {setIsRegister(true); setMessage(null);}} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${isRegister ? 'bg-teal-500 text-white shadow-xl' : 'text-white/40'}`}>Join Us</button>
        </div>
        <form onSubmit={handleAuth} className="space-y-5">
          {isRegister && (
            <>
              <input type="text" placeholder="Full Name" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold" value={name} onChange={e => setName(e.target.value)} required />
              <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none cursor-pointer font-bold">
                <option disabled value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} className="text-black bg-white" value={d}>{d}</option>)}
              </select>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none cursor-pointer font-bold">
                <option className="text-black bg-white" value="employee">Employee</option>
                <option className="text-black bg-white" value="admin">Admin</option>
              </select>
            </>
          )}
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none font-bold" />
          <input type="password" placeholder="Account Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none font-bold" />
          <button type="submit" disabled={isLoading} className="w-full py-5 bg-teal-500 hover:bg-teal-400 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all transform active:scale-95">{isLoading ? "Verifying..." : (isRegister ? "Create Account" : "Access Dashboard")}</button>
        </form>
        {message && <div className={`mt-8 p-4 rounded-2xl text-center font-black text-[10px] uppercase tracking-tighter border-2 ${message.type === "success" ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-red-500/20 border-red-500/50 text-red-400"}`}>{message.text}</div>}
      </div>
    </div>
  );
};

export default App;