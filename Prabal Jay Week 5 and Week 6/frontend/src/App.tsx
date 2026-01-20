import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, CheckCircle, XCircle, Layout, LogOut, User, Mail, Briefcase, BadgeCheck, 
  Pencil, Save, X, Send, Calendar, MessageSquare, Clock, ArrowRight, Filter, 
  Trash2, Eye, Sun, Moon, Image as ImageIcon, Link, Upload, Video, Hash, Shield, Bell,
  ThumbsUp, HandMetal, Star, MessageCircle
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';
const DEPARTMENTS = ["Engineering", "Sales", "Finance"];

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('bragboard_token'));
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  const [feed, setFeed] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState('All');
  const [filterSender, setFilterSender] = useState('');

  const [shoutoutMsg, setShoutoutMsg] = useState('');
  const [mediaType, setMediaType] = useState<'link' | 'upload'>('link');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [taggedUserIds, setTaggedUserIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [commentInputs, setCommentInputs] = useState<{[key: number]: string}>({});

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
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
        const uData = await uRes.json();
        setUser(uData); setEditName(uData.name); setEditDept(uData.department);
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
      if (res.ok) {
        let feedData = await res.json();
        if (filterSender) {
          feedData = feedData.filter((post: any) => 
            post.sender.name.toLowerCase().includes(filterSender.toLowerCase())
          );
        }
        setFeed(feedData);
      }
    } catch (error) { console.error("Failed to fetch feed:", error); }
  }, [token, filterDept, filterSender]);

  useEffect(() => { if (token) { fetchData(); fetchFeed(); } }, [token, fetchData, fetchFeed]);

  const logout = () => {
    setToken(null); setUser(null); localStorage.removeItem('bragboard_token');
    setMessage({ type: 'success', text: 'Logged out successfully' });
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
    if (!window.confirm("Delete post?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/shoutouts/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setMessage({ type: "success", text: "Post deleted" }); fetchFeed(); fetchData(); }
    } catch (e) { setMessage({ type: "error", text: "Error deleting post" }); }
  };

  const handleReact = async (id: number, type: string) => {
    try {
      await fetch(`${API_BASE_URL}/shoutouts/${id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type })
      });
      fetchFeed();
    } catch (e) { console.error(e); }
  };

  const handleComment = async (id: number) => {
    const content = commentInputs[id];
    if (!content?.trim()) return;
    try {
      await fetch(`${API_BASE_URL}/shoutouts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content })
      });
      setCommentInputs({ ...commentInputs, [id]: '' });
      fetchFeed();
    } catch (e) { console.error(e); }
  };

  const getReactionCount = (post: any, type: string) => post.reactions?.filter((r: any) => r.type === type).length || 0;
  const hasReacted = (post: any, type: string) => post.reactions?.some((r: any) => r.type === type && r.user_id === user.id);

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, department: editDept }),
      });
      if (res.ok) { 
        const updatedUser = await res.json();
        setUser(updatedUser); setIsEditing(false); 
        setMessage({ type: "success", text: "Profile updated!" }); 
      }
    } catch (e) { setMessage({ type: "error", text: "Update failed" }); }
  };

  const handleMarkSeen = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/shoutouts/${id}/seen`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      const el = document.getElementById(`post-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) { console.error(e); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const url = isRegister ? `${API_BASE_URL}/register` : `${API_BASE_URL}/token`;
      const body = isRegister ? JSON.stringify({ name, email, password, department, role: "employee" }) : new URLSearchParams({ username: email, password }).toString();
      const headers = isRegister ? { "Content-Type": "application/json" } : { "Content-Type": "application/x-www-form-urlencoded" };
      const res = await fetch(url, { method: "POST", headers, body });
      if (res.ok) {
        if (isRegister) { setMessage({ type: "success", text: "Registered! Please login." }); setIsRegister(false); }
        else { const data = await res.json(); setToken(data.access_token); localStorage.setItem("bragboard_token", data.access_token); setMessage(null); }
      } else setMessage({ type: "error", text: "Auth failed" });
    } catch (e) { setMessage({ type: "error", text: "Connection error" }); } finally { setIsLoading(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const bg = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800';
  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const input = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900';
  const textMain = darkMode ? 'text-white' : 'text-gray-900';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-600';

  if (token && user) {
    return (
      <div className={`min-h-screen ${bg} flex font-sans transition-colors duration-300`}>
        <aside className={`${darkMode ? 'bg-gray-900 border-r border-gray-800' : 'bg-teal-900'} w-72 text-white flex flex-col shadow-xl flex-shrink-0 transition-colors duration-300 sticky top-0 h-screen overflow-y-auto`}>
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center"><Zap className="w-6 h-6 text-teal-400 mr-2" /><span className="text-xl font-bold">BragBoard</span></div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 rounded-full hover:bg-white/10 transition">{darkMode ? <Sun className="w-4 h-4 text-yellow-300"/> : <Moon className="w-4 h-4 text-teal-200"/>}</button>
          </div>
          <nav className="flex-1 p-4 space-y-2 mt-4">
            <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${currentView === 'dashboard' ? 'bg-white/10 shadow-inner font-bold' : 'hover:bg-white/5'}`}><Layout className="w-5 h-5" /><span>Dashboard</span></button>
            <button onClick={() => setCurrentView('profile')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${currentView === 'profile' ? 'bg-white/10 shadow-inner font-bold' : 'hover:bg-white/5'}`}><User className="w-5 h-5" /><span>My Profile</span></button>
          </nav>
          <div className="px-4 py-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-white/50 mb-2"><span>Notifications</span>{notifications.length > 0 && <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5">{notifications.length}</span>}</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">{notifications.length === 0 ? (<div className="text-xs text-white/30 italic">No new notifications</div>) : (notifications.map(n => (<div key={n.id} onClick={() => handleMarkSeen(n.id)} className="bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition"><div className="text-xs font-bold text-teal-300">{n.sender.name}</div><div className="text-[10px] text-white/70 truncate">sent you a shoutout!</div></div>)))}</div>
          </div>
          <div className="p-4 border-t border-white/10 mt-auto">
            <div className="flex items-center space-x-3 mb-4"><div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center font-bold text-lg border-2 border-teal-400/30">{user.name.charAt(0).toUpperCase()}</div><div className="overflow-hidden"><div className="text-sm font-semibold truncate w-24">{user.name}</div><div className="text-xs opacity-75 truncate">{user.department}</div></div></div>
            <button onClick={logout} className="w-full flex items-center justify-center space-x-2 py-2 bg-red-600/90 hover:bg-red-600 text-white text-sm rounded-md transition shadow-md"><LogOut className="w-4 h-4" /><span>Sign Out</span></button>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center shadow-sm ${message.type === 'success' ? 'bg-green-100 text-green-900 border border-green-200' : 'bg-red-100 text-red-900 border border-red-200'}`}>{message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <XCircle className="w-5 h-5 mr-3" />}<span className="font-medium">{message.text}</span><button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button></div>
          )}

          {currentView === 'dashboard' ? (
            <div className="max-w-4xl mx-auto">
              <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div><h1 className={`text-3xl font-bold ${textMain}`}>Company Feed</h1><p className={`${textSub} mt-1 font-medium`}>Celebrate wins!</p></div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border shadow-sm ${card}`}><Filter className={`w-4 h-4 ${textSub}`} /><span className={`text-sm font-bold ${textSub}`}>Dept:</span><select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className={`bg-transparent text-sm font-bold outline-none cursor-pointer ${textMain}`}><option value="All">All</option>{DEPARTMENTS.map(d => <option key={d} value={d} className="text-gray-900">{d}</option>)}</select></div>
              </header>
              <div className={`rounded-xl shadow-sm border p-6 mb-8 transition-all ${card}`}>
                <textarea value={shoutoutMsg} onChange={(e) => setShoutoutMsg(e.target.value)} placeholder={`What's the good news, ${user.name.split(' ')[0]}?`} className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none min-h-[80px] mb-3 resize-none font-medium ${input}`} />
                <div className="flex items-center space-x-4 mb-4"><button onClick={() => setMediaType('link')} className={`text-xs font-bold uppercase flex items-center space-x-1 ${mediaType === 'link' ? 'text-teal-600' : 'opacity-40 hover:opacity-100'}`}><Link className="w-3 h-3"/><span>Link</span></button><button onClick={() => setMediaType('upload')} className={`text-xs font-bold uppercase flex items-center space-x-1 ${mediaType === 'upload' ? 'text-teal-600' : 'opacity-40 hover:opacity-100'}`}><Upload className="w-3 h-3"/><span>Upload</span></button></div>
                {mediaType === 'link' ? <input type="text" value={mediaUrlInput} onChange={(e) => setMediaUrlInput(e.target.value)} placeholder="Paste URL" className={`w-full p-2 mb-4 text-sm border rounded-lg focus:ring-1 focus:ring-teal-500 outline-none ${input}`} /> : <input type="file" ref={fileInputRef} onChange={(e) => setMediaFile(e.target.files ? e.target.files[0] : null)} accept="image/*,video/*" className={`w-full p-2 mb-4 text-sm border rounded-lg outline-none ${input}`} />}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-wrap gap-2 items-center"><span className={`text-xs font-bold uppercase mr-2 tracking-widest ${textSub}`}>Tag:</span>{activeUsers.filter(u => u.id !== user.id).map(u => (<button key={u.id} onClick={() => setTaggedUserIds(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])} className={`px-3 py-1 rounded-full text-xs font-medium flex items-center border transition ${taggedUserIds.includes(u.id) ? 'bg-teal-600 text-white border-teal-700' : `opacity-70 hover:opacity-100 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200 text-gray-800'}`}`}>{u.name} <span className="ml-1 opacity-70 text-[9px]">({u.department})</span>{taggedUserIds.includes(u.id) && <CheckCircle className="w-3 h-3 ml-1 fill-white text-teal-600" />}</button>))}</div>
                  <button onClick={handlePostShoutout} disabled={isLoading} className="w-full md:w-auto px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"><Send className="w-4 h-4 inline mr-2" />Post</button>
                </div>
              </div>
              <div className="space-y-6">
                {feed.map((post: any) => (
                  <div key={post.id} id={`post-${post.id}`} className={`rounded-2xl shadow-sm border p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${card}`}>
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-md">{post.sender.name.charAt(0).toUpperCase()}</div>
                        <div><div className={`font-bold text-lg ${textMain}`}>{post.sender.name} <span className={`font-normal text-sm ml-1 ${textSub}`}>({post.sender.department})</span></div><div className={`text-xs flex items-center mt-0.5 ${textSub}`}><Clock className="w-3 h-3 mr-1" />{formatDate(post.created_at)}</div></div>
                      </div>
                      {post.sender.id === user.id && <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition"><Trash2 className="w-5 h-5" /></button>}
                    </div>
                    <p className={`text-lg mb-6 leading-relaxed font-medium ${textMain}`}>{post.message}</p>
                    {post.image_url && (<div className="mb-6 rounded-2xl overflow-hidden border border-gray-200/20 bg-black/5 flex justify-center">{post.image_url.match(/\.(mp4|webm|mov|ogg)($|\?)/i) ? <video src={post.image_url} controls className="w-full max-h-[500px] object-contain bg-black" /> : <img src={post.image_url} alt="Media" className="w-full max-h-[500px] object-contain" onError={(e) => {console.error("Image load fail", post.image_url)}}/>}</div>)}
                    
                    <div className="flex space-x-4 mb-4 pt-2">
                        <button onClick={() => handleReact(post.id, 'like')} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition ${hasReacted(post, 'like') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}><ThumbsUp className={`w-4 h-4 ${hasReacted(post, 'like') ? 'fill-blue-600 dark:fill-blue-300' : ''}`} /><span className="text-xs font-bold">{getReactionCount(post, 'like') || ''}</span></button>
                        <button onClick={() => handleReact(post.id, 'clap')} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition ${hasReacted(post, 'clap') ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}><HandMetal className={`w-4 h-4 ${hasReacted(post, 'clap') ? 'fill-yellow-600 dark:fill-yellow-300' : ''}`} /><span className="text-xs font-bold">{getReactionCount(post, 'clap') || ''}</span></button>
                        <button onClick={() => handleReact(post.id, 'star')} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition ${hasReacted(post, 'star') ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}><Star className={`w-4 h-4 ${hasReacted(post, 'star') ? 'fill-purple-600 dark:fill-purple-300' : ''}`} /><span className="text-xs font-bold">{getReactionCount(post, 'star') || ''}</span></button>
                    </div>
                    {}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                      {post.comments?.length > 0 && <div className="space-y-3 mb-4">{post.comments.map((c: any) => (<div key={c.id} className="flex gap-2"><div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-800 flex-shrink-0">{c.user.name.charAt(0)}</div><div className="text-sm"><span className="font-bold mr-2">{c.user.name}</span><span className={textMain}>{c.content}</span></div></div>))}</div>}
                      <div className="flex items-center gap-2"><input type="text" placeholder="Add a comment..." className={`flex-1 p-2 text-sm rounded-lg border ${input}`} value={commentInputs[post.id] || ''} onChange={e => setCommentInputs({...commentInputs, [post.id]: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleComment(post.id)} /><button onClick={() => handleComment(post.id)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"><MessageCircle className="w-4 h-4"/></button></div>
                    </div>
                    <div className="flex items-center text-sm pt-4 border-t border-gray-100 dark:border-gray-700 mt-4"><span className={`font-bold mr-3 flex items-center text-teal-600 dark:text-teal-400`}><ArrowRight className="w-4 h-4 mr-1"/> Recipients:</span><div className="flex flex-wrap gap-2">{post.recipients.map((r: any, idx: number) => (<span key={idx} className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${darkMode ? 'bg-teal-500/10 text-teal-300' : 'bg-teal-50 text-teal-700'}`}><span>{r.recipient.name}</span><span title={r.is_seen ? "Seen" : "Unseen"}>{r.is_seen ? <Eye className="w-3.5 h-3.5 text-blue-500" /> : <span className="w-2 h-2 rounded-full bg-gray-400/50"></span>}</span></span>))}</div></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <header className="mb-8 flex justify-between items-center"><div><h1 className={`text-3xl font-bold ${textMain}`}>My Profile</h1></div>{!isEditing && <button onClick={() => setIsEditing(true)} className={`flex items-center space-x-2 px-4 py-2 border rounded-xl shadow-sm hover:bg-gray-50/10 transition ${card} ${textMain}`}><Pencil className="w-4 h-4" /><span>Edit Profile</span></button>}</header>
              <div className={`rounded-3xl shadow-sm border overflow-hidden mb-8 ${card}`}>
                <div className="bg-gradient-to-r from-teal-600 to-teal-400 h-32 relative"><div className="absolute -bottom-14 left-10"><div className={`w-28 h-28 rounded-full p-1.5 shadow-2xl ${card}`}><div className="w-full h-full rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-4xl font-black">{user.name.charAt(0).toUpperCase()}</div></div></div></div>
                <div className="pt-20 pb-10 px-10">
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className={`block text-xs font-bold uppercase opacity-50 mb-2 ${textSub}`}>Name</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={`w-full p-3 border rounded-xl outline-none ${input}`} /></div>
                        <div><label className={`block text-xs font-bold uppercase opacity-50 mb-2 ${textSub}`}>Department</label><select value={editDept} onChange={(e) => setEditDept(e.target.value)} className={`w-full p-3 border rounded-xl outline-none ${input}`}>{DEPARTMENTS.map(d => <option key={d} value={d} className="text-gray-900">{d}</option>)}</select></div>
                      </div>
                      <div className="flex space-x-3 pt-2"><button onClick={handleUpdateProfile} className="flex items-center space-x-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold shadow-lg transition">Save</button><button onClick={() => setIsEditing(false)} className={`px-6 py-2.5 rounded-xl font-medium transition ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>Cancel</button></div>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
              <div className={`rounded-2xl shadow-sm border p-6 ${card}`}>
                <h3 className="text-xl font-bold mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-teal-500"/> Sent Shoutouts</h3>
                <div className="space-y-4">{user.shoutouts_sent.map((s: any) => (
                  <div key={s.id} className={`p-4 rounded-lg border transition ${darkMode ? 'bg-white/5 border-white/10 hover:border-teal-500/50' : 'bg-gray-50 border-gray-100 hover:border-teal-200'}`}>
                    <div className="flex justify-between items-start mb-2"><div className="flex items-center space-x-2 text-sm opacity-60"><Clock className="w-3 h-3"/><span>{formatDate(s.created_at)}</span></div><div className="flex items-center space-x-3"><div className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full ${darkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-800'}`}><ArrowRight className="w-3 h-3" /><span>To: {s.recipients.map((r: any) => r.recipient.name).join(', ')}</span></div><button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4"/></button></div></div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col justify-center items-center p-4 font-sans text-white">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/20 p-12">
        <header className="text-center mb-10"><h1 className="text-5xl font-black tracking-tighter mb-2 italic">BragBoard</h1><p className="text-teal-200 uppercase tracking-widest text-[10px]">Internal Recognition Platform</p></header>
        <div className="flex bg-black/30 rounded-2xl p-1.5 mb-8 border border-white/5">
          <button onClick={() => {setIsRegister(false); setMessage(null);}} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${!isRegister ? 'bg-teal-500 text-white shadow-xl' : 'text-teal-100'}`}>Sign In</button>
          <button onClick={() => {setIsRegister(true); setMessage(null);}} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${isRegister ? 'bg-teal-500 text-white shadow-xl' : 'text-teal-100'}`}>Join Us</button>
        </div>
        <form onSubmit={handleAuth} className="space-y-5">
          {isRegister && <><input type="text" placeholder="Full Name" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none" value={name} onChange={e => setName(e.target.value)} required /><select value={department} onChange={e => setDepartment(e.target.value)} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-teal-100 appearance-none cursor-pointer"><option disabled>Select Department</option>{DEPARTMENTS.map(d => <option key={d} className="text-black">{d}</option>)}</select></>}
          <input type="email" placeholder="Email" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={isLoading} className="w-full py-4.5 bg-teal-500 hover:bg-teal-400 rounded-2xl font-black uppercase tracking-widest shadow-lg transition disabled:opacity-50">{isLoading ? 'Wait...' : (isRegister ? 'Join' : 'Access Dashboard')}</button>
        </form>
        {message && <div className={`mt-8 p-4 rounded-2xl text-center border font-bold text-xs uppercase tracking-tighter ${message.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-red-500/20 border-red-500/50 text-red-300'}`}>{message.text}</div>}
      </div>
    </div>
  );
};

export default App;