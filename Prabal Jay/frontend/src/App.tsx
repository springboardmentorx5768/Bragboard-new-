import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, CheckCircle, XCircle, Layout, LogOut, User, Mail, Briefcase, 
  Pencil, X, Send, Clock, ArrowRight, Filter, 
  Trash2, Eye, Sun, Moon, Link, Upload,
  Calendar, BadgeCheck, Hash, Shield, MessageSquare, Bell
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

  const [shoutoutMsg, setShoutoutMsg] = useState('');
  const [mediaType, setMediaType] = useState<'link' | 'upload'>('link');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [taggedUserIds, setTaggedUserIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchFeed = useCallback(async () => {
    if (!token) return;
    try {
      let url = `${API_BASE_URL}/shoutouts?`;
      if (filterDept !== 'All') url += `department=${filterDept}&`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFeed(await res.json());
    } catch (e) { console.error(e); }
  }, [token, filterDept]);

  useEffect(() => { if (token) { fetchData(); fetchFeed(); } }, [token, fetchData, fetchFeed]);

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
        fetchFeed(); fetchData();
      }
    } catch (e) { setMessage({ type: "error", text: "Connection error" }); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/shoutouts/${id}`, { 
        method: "DELETE", headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) { setMessage({ type: "success", text: "Deleted" }); fetchFeed(); fetchData(); }
    } catch { setMessage({ type: "error", text: "Delete failed" }); }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, department: editDept })
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated); setIsEditing(false);
        setMessage({ type: "success", text: "Profile updated!" });
      }
    } catch { setMessage({ type: "error", text: "Update failed" }); }
  };

  const handleMarkSeen = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/shoutouts/${id}/seen`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.id !== id));
      setCurrentView("dashboard");
      setTimeout(() => {
        const el = document.getElementById(`post-${id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } catch (e) { }
  };

  const handleAuth = async (e: any) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const url = isRegister ? `${API_BASE_URL}/register` : `${API_BASE_URL}/token`;
      const body = isRegister ? JSON.stringify({ name, email, password, department, role: "employee" }) 
                               : new URLSearchParams({ username: email, password }).toString();
      const headers = isRegister ? { "Content-Type": "application/json" } : { "Content-Type": "application/x-www-form-urlencoded" };
      const res = await fetch(url, { method: "POST", headers, body });
      if (res.ok) {
        if (isRegister) { setMessage({ type: "success", text: "Registered! Login." }); setIsRegister(false); }
        else {
          const data = await res.json(); setToken(data.access_token);
          localStorage.setItem("bragboard_token", data.access_token); setMessage(null);
        }
      } else setMessage({ type: "error", text: "Auth failed" });
    } catch { setMessage({ type: "error", text: "Connection issue" }) }
    finally { setIsLoading(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const bg = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900';
  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300 shadow-sm';
  const input = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900';
  const textMain = darkMode ? 'text-white' : 'text-black';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-700';

  if (token && user) {
    return (
      <div className={`min-h-screen ${bg} flex transition-colors duration-300`}>
        {/* FIXED SIDEBAR */}
        <aside className={`${darkMode ? 'bg-gray-900 border-r border-gray-800' : 'bg-teal-900'} w-72 text-white flex flex-col sticky top-0 h-screen overflow-y-auto z-10 shadow-2xl`}>
          <div className="p-8 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center"><Zap className="w-7 h-7 text-teal-400 mr-2" /><span className="text-2xl font-black tracking-tighter">BragBoard</span></div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-white/10 transition">{darkMode ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5 text-teal-200" />}</button>
          </div>

          <nav className="p-6 space-y-3">
            <button onClick={() => setCurrentView("dashboard")} className={`w-full flex items-center p-4 rounded-xl transition ${currentView === "dashboard" ? 'bg-white/20 shadow-inner font-bold' : 'hover:bg-white/5'}`}><Layout className="w-5 mr-3" />Dashboard</button>
            <button onClick={() => setCurrentView("profile")} className={`w-full flex items-center p-4 rounded-xl transition ${currentView === "profile" ? 'bg-white/20 shadow-inner font-bold' : 'hover:bg-white/5'}`}><User className="w-5 mr-3" />My Profile</button>
          </nav>

          {/* NOTIFICATIONS SECTION */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between text-xs font-black uppercase text-teal-400/70 mb-4 tracking-widest"><div className="flex items-center"><Bell className="w-3 h-3 mr-2"/>Notifications</div>{notifications.length > 0 && <span className="bg-red-500 text-white px-2 rounded-full animate-pulse">{notifications.length}</span>}</div>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {notifications.length === 0 ? <div className="text-xs text-white/30 italic">All caught up!</div> : notifications.map(n => (
                <div key={n.id} onClick={() => handleMarkSeen(n.id)} className="bg-white/10 p-3 rounded-lg cursor-pointer hover:bg-white/20 border border-white/5 transition"><div className="text-xs font-bold text-teal-300">{n.sender.name}</div><div className="text-[10px] text-white/60 truncate">Sent you a shoutout!</div></div>
              ))}
            </div>
          </div>

          <div className="mt-auto p-6 border-t border-white/10 bg-black/10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">{user.name.charAt(0).toUpperCase()}</div>
              <div className="overflow-hidden"><p className="text-sm font-bold truncate">{user.name}</p><p className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">{user.department}</p></div>
            </div>
            <button onClick={logout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-xl flex items-center justify-center transition shadow-lg"><LogOut className="w-4 mr-2" />Sign Out</button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 p-10 overflow-y-auto">
          {message && <div className={`mb-8 p-5 rounded-2xl flex items-center shadow-lg border-l-8 animate-bounce ${message.type === "success" ? "bg-green-100 text-green-800 border-green-500" : "bg-red-100 text-red-800 border-red-500"}`}>{message.type === "success" ? <CheckCircle className="w-6 mr-3" /> : <XCircle className="w-6 mr-3" />}{message.text}<button className="ml-auto hover:scale-110 transition" onClick={() => setMessage(null)}><X /></button></div>}

          {currentView === "dashboard" ? (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
              <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div><h1 className={`text-4xl font-black tracking-tight ${textMain}`}>Public Feed</h1><p className={`${textSub} font-bold`}>Celebrate every win, big or small!</p></div>
                <div className={`border-2 p-3 rounded-2xl flex items-center space-x-3 ${card}`}><Filter className="w-4 text-teal-600" /><span className={`text-xs font-black uppercase ${textSub}`}>Department:</span><select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-transparent font-bold outline-none cursor-pointer text-teal-600"><option value="All">All Feed</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
              </div>

              {/* POST CREATOR */}
              <div className={`${card} border-2 p-8 rounded-3xl mb-12 shadow-xl`}>
                <textarea value={shoutoutMsg} onChange={e => setShoutoutMsg(e.target.value)} className={`w-full p-5 rounded-2xl border-2 mb-4 focus:ring-4 focus:ring-teal-500/20 outline-none font-bold text-lg resize-none min-h-[120px] ${input}`} placeholder={`What's the good news, ${user.name.split(" ")[0]}?`} />
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-6">
                      <button onClick={() => setMediaType("link")} className={`flex items-center text-sm font-black uppercase transition ${mediaType === "link" ? "text-teal-600 scale-105" : "opacity-40"}`}><Link className="w-4 mr-2" />Add Link</button>
                      <button onClick={() => setMediaType("upload")} className={`flex items-center text-sm font-black uppercase transition ${mediaType === "upload" ? "text-teal-600 scale-105" : "opacity-40"}`}><Upload className="w-4 mr-2" />Upload File</button>
                    </div>
                    {mediaType === "link" ? <input type="text" value={mediaUrlInput} onChange={e => setMediaUrlInput(e.target.value)} placeholder="Paste image/video URL" className={`w-full p-3 rounded-xl border-2 font-bold ${input}`} /> : <input ref={fileInputRef} type="file" onChange={e => setMediaFile(e.target.files?.[0] || null)} className={`w-full p-2 border-2 rounded-xl font-bold ${input}`} accept="image/*,video/*" />}
                    <div className="flex flex-wrap gap-2 items-center"><span className={`text-[10px] font-black uppercase tracking-widest mr-2 ${textSub}`}>Tag:</span>{activeUsers.filter(u => u.id !== user.id).map(u => (<button key={u.id} onClick={() => setTaggedUserIds(prev => prev.includes(u.id) ? prev.filter(i => i !== u.id) : [...prev, u.id])} className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition ${taggedUserIds.includes(u.id) ? 'bg-teal-600 text-white border-teal-700' : `hover:border-teal-500 ${darkMode ? 'bg-gray-700' : 'bg-gray-100 text-black'}`}`}>{u.name} <span className="opacity-50 text-[10px]">({u.department})</span></button>))}</div>
                  </div>
                  <button onClick={handlePostShoutout} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 h-fit"><Send className="w-5 mr-2 inline" />POST WIN</button>
                </div>
              </div>

              {/* FEED LIST */}
              <div className="space-y-8">
                {feed.map((post: any) => (
                  <div key={post.id} id={`post-${post.id}`} className={`rounded-[2.5rem] shadow-lg border-2 p-8 animate-in slide-in-from-bottom duration-500 ${card}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-700 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-md">{post.sender.name.charAt(0).toUpperCase()}</div>
                        <div><p className={`text-xl font-black ${textMain}`}>{post.sender.name} <span className="text-teal-600 font-bold text-sm ml-2">#{post.sender.department}</span></p><p className={`text-xs font-bold flex items-center opacity-60 ${textSub}`}><Clock className="w-3 mr-1" />{formatDate(post.created_at)}</p></div>
                      </div>
                      {post.sender.id === user.id && <button onClick={() => handleDelete(post.id)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"><Trash2 /></button>}
                    </div>
                    <p className={`text-xl leading-relaxed mb-6 font-medium ${textMain}`}>{post.message}</p>
                    {post.image_url && (
                      <div className="rounded-3xl overflow-hidden border-4 border-black/5 bg-black/5 flex justify-center mb-6">
                        {post.image_url.match(/\.(mp4|mov|webm|ogg)($|\?)/i) ? <video src={post.image_url} controls className="w-full max-h-[500px] object-contain bg-black" /> : <img src={post.image_url} className="w-full max-h-[500px] object-contain" alt="Attached Media" />}
                      </div>
                    )}
                    <div className="text-sm pt-5 border-t-2 border-dashed border-gray-200/20 flex flex-wrap gap-3 items-center">
                      <span className="font-black text-teal-600 uppercase text-xs tracking-widest mr-2 flex items-center"><ArrowRight className="w-4 mr-1" />Recognized:</span>
                      {post.recipients.map((r: any, idx: number) => (
                        <span key={idx} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${darkMode ? 'bg-teal-900/50 text-teal-300' : 'bg-teal-50 text-teal-900 border border-teal-100'}`}>
                          <span>{r.recipient.name}</span>
                          <span title={r.is_seen ? "User has seen this" : "Not seen yet"}>{r.is_seen ? <Eye className="w-4 h-4 text-blue-500" /> : <div className="w-2 h-2 rounded-full bg-gray-400" />}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* --- PROFILE VIEW --- */
            <div className="max-w-5xl mx-auto animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-end mb-8">
                <div><h1 className={`text-4xl font-black ${textMain}`}>My Profile</h1><p className={textSub}>Manage your details and history</p></div>
                {!isEditing && <button onClick={() => setIsEditing(true)} className={`flex items-center space-x-2 px-6 py-3 rounded-2xl border-2 font-black transition hover:bg-teal-600 hover:text-white ${card} ${textMain}`}><Pencil className="w-4" />Edit Profile</button>}
              </div>

              <div className={`${card} rounded-[3rem] border-2 overflow-hidden shadow-2xl mb-12`}>
                <div className="bg-gradient-to-r from-teal-700 to-teal-400 h-48 relative">
                  <div className="absolute -bottom-16 left-12">
                    <div className={`${card} p-2 w-40 h-40 rounded-[2.5rem] shadow-2xl`}>
                      <div className="bg-teal-100 w-full h-full rounded-[2rem] flex items-center justify-center text-6xl font-black text-teal-700 shadow-inner">{user.name.charAt(0).toUpperCase()}</div>
                    </div>
                  </div>
                </div>

                <div className="px-12 pt-24 pb-12">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                      <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest text-teal-600">Full Name</label><input className={`w-full p-4 rounded-2xl border-2 outline-none font-bold text-lg ${input}`} value={editName} onChange={e => setEditName(e.target.value)} /></div>
                      <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest text-teal-600">Department</label><select className={`w-full p-4 rounded-2xl border-2 outline-none font-bold text-lg ${input}`} value={editDept} onChange={e => setEditDept(e.target.value)}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
                      <div className="flex space-x-4 pt-4 md:col-span-2"><button onClick={handleUpdateProfile} className="bg-teal-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:bg-teal-700 transition">SAVE CHANGES</button><button onClick={() => setIsEditing(false)} className="px-10 py-4 rounded-2xl border-2 font-bold transition hover:bg-gray-100 dark:hover:bg-gray-700">CANCEL</button></div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className="flex items-center justify-between"><h2 className={`text-5xl font-black tracking-tighter ${textMain}`}>{user.name}</h2><span className="px-6 py-2 text-xs font-black rounded-full bg-teal-600 text-white shadow-lg uppercase tracking-widest">{user.role}</span></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className={`p-6 rounded-3xl border-2 transition hover:scale-105 ${card}`}><div className="flex items-center mb-3"><Hash className="w-5 text-teal-600 mr-3" /><p className="text-[10px] font-black uppercase tracking-widest opacity-50">Member ID</p></div><p className={`text-xl font-black ${textMain}`}>#{user.id}</p></div>
                        <div className={`p-6 rounded-3xl border-2 transition hover:scale-105 ${card}`}><div className="flex items-center mb-3"><Mail className="w-5 text-teal-600 mr-3" /><p className="text-[10px] font-black uppercase tracking-widest opacity-50">Email Address</p></div><p className={`text-xl font-black ${textMain}`}>{user.email}</p></div>
                        <div className={`p-6 rounded-3xl border-2 transition hover:scale-105 ${card}`}><div className="flex items-center mb-3"><Briefcase className="w-5 text-teal-600 mr-3" /><p className="text-[10px] font-black uppercase tracking-widest opacity-50">Department</p></div><p className={`text-xl font-black ${textMain}`}>{user.department}</p></div>
                        <div className={`p-6 rounded-3xl border-2 transition hover:scale-105 ${card}`}><div className="flex items-center mb-3"><Shield className="w-5 text-teal-600 mr-3" /><p className="text-[10px] font-black uppercase tracking-widest opacity-50">Account Role</p></div><p className={`text-xl font-black capitalize ${textMain}`}>{user.role}</p></div>
                        <div className={`p-6 rounded-3xl border-2 transition hover:scale-105 ${card}`}><div className="flex items-center mb-3"><Calendar className="w-5 text-teal-600 mr-3" /><p className="text-[10px] font-black uppercase tracking-widest opacity-50">Joined On</p></div><p className={`text-xl font-black ${textMain}`}>{new Date(user.joined_at).toLocaleDateString()}</p></div>
                        <div className={`p-6 rounded-3xl border-2 transition hover:scale-105 ${card}`}><div className="flex items-center mb-3"><BadgeCheck className="w-5 text-green-500 mr-3" /><p className="text-[10px] font-black uppercase tracking-widest opacity-50">Account Status</p></div><p className="text-xl font-black text-green-600">Active & Verified</p></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SENT HISTORY SECTION */}
              <div className={`${card} border-2 p-10 rounded-[3rem] shadow-xl`}>
                <h3 className="text-3xl font-black mb-8 flex items-center tracking-tight"><MessageSquare className="w-8 h-8 mr-4 text-teal-600" />Your Shoutout History</h3>
                {user.shoutouts_sent?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {user.shoutouts_sent.map((s: any) => (
                      <div key={s.id} className={`p-6 rounded-3xl border-2 group transition-all hover:border-teal-500/50 ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-4"><div className="text-[10px] font-black opacity-50 uppercase tracking-tighter flex items-center"><Clock className="w-3 h-3 mr-1" />{formatDate(s.created_at)}</div><button onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition"><Trash2 className="w-4" /></button></div>
                        <p className={`text-lg font-bold leading-snug mb-4 ${textMain}`}>"{s.message}"</p>
                        <div className="pt-4 border-t-2 border-white/5 flex items-center text-[10px] font-black uppercase text-teal-600 tracking-widest"><ArrowRight className="w-3 h-3 mr-1" />Sent to: {s.recipients.map((r: any) => r.recipient.name).join(', ')}</div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-center py-20 border-4 border-dashed rounded-[2rem] opacity-30 font-black text-2xl uppercase tracking-widest">No shoutouts sent yet</div>}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center text-white p-6 font-sans">
      <div className="bg-white/10 shadow-2xl p-12 rounded-[3.5rem] w-full max-w-lg backdrop-blur-2xl border border-white/10">
        <div className="flex justify-center mb-8"><div className="bg-teal-500/20 p-5 rounded-[2rem] border border-teal-500/30"><Zap className="w-12 h-12 text-teal-400 fill-teal-400" /></div></div>
        <h1 className="text-5xl font-black text-center mb-2 tracking-tighter italic">BragBoard</h1>
        <p className="text-center text-teal-400 text-xs font-black uppercase tracking-widest mb-10 opacity-70">Employee Recognition Portal</p>
        <div className="flex mb-10 p-1.5 rounded-2xl bg-black/40 border border-white/5">
          <button onClick={() => { setIsRegister(false); setMessage(null) }} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${!isRegister ? 'bg-teal-500 text-white shadow-xl scale-105' : 'text-white/40'}`}>Sign In</button>
          <button onClick={() => { setIsRegister(true); setMessage(null) }} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${isRegister ? 'bg-teal-500 text-white shadow-xl scale-105' : 'text-white/40'}`}>Join Now</button>
        </div>
        <form onSubmit={handleAuth} className="space-y-6">
          {isRegister && (
            <div className="animate-in slide-in-from-top duration-300 space-y-6">
              <input placeholder="Enter Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-teal-500 transition font-bold" />
              <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-teal-500 transition font-bold text-white"><option disabled>Select Your Department</option>{DEPARTMENTS.map(d => <option key={d} className="text-black">{d}</option>)}</select>
            </div>
          )}
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-teal-500 transition font-bold" />
          <input type="password" placeholder="Account Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-teal-500 transition font-bold" />
          <button type="submit" disabled={isLoading} className="w-full py-5 bg-teal-500 hover:bg-teal-400 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95">{isLoading ? "Verifying..." : (isRegister ? "Create Account" : "Access Dashboard")}</button>
        </form>
        {message && <div className={`mt-8 p-4 rounded-2xl text-center font-black text-[10px] uppercase tracking-tighter border-2 ${message.type === "success" ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-red-500/20 border-red-500/50 text-red-400"}`}>{message.text}</div>}
      </div>
    </div>
  );
};

export default App;