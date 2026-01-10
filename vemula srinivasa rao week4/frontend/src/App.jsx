import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, User, LayoutDashboard, Users, Building2, MessageSquare, LogOut, Menu, X, Send, Filter, Image as ImageIcon, X as XIcon, Calendar, Clock, Tag, Search, Mail, Lock } from 'lucide-react';
const API_URL = 'http://localhost:8000';

const BragBoardApp = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', username: '', role: 'employee', department_id: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shoutouts, setShoutouts] = useState([]);
  const [filteredShoutouts, setFilteredShoutouts] = useState([]);
  const [shoutoutForm, setShoutoutForm] = useState({ message: '', recipient_ids: [], image_url: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [filters, setFilters] = useState({ 
    department_id: '', 
    sender_id: '', 
    start_date: '', 
    end_date: '', 
    search: '',
    sortBy: 'newest' // NEW: Add sort option
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // NEW: 'all', 'sent', 'received'

  // Load departments on component mount (for signup page)
  // Load departments on component mount (for signup page)
useEffect(() => {
  console.log('🚀 App mounted, fetching departments...');
  fetchDepartments();
}, []); // Run once on mount

useEffect(() => {
  console.log('🔐 Login status changed:', isLoggedIn);
  if (isLoggedIn) {
    console.log('✅ Fetching users and shoutouts...');
    fetchUsers();
    fetchShoutouts();
  }
}, [isLoggedIn]); // Run when login status changes

useEffect(() => {
  console.log('🔍 Applying filters...');
  applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [filters, shoutouts, viewMode, users]); // Run when filters change
  // After all the useEffect hooks, add these functions:

const fetchUsers = async () => {
  try {
    const token = localStorage.getItem('authToken');
    console.log('👥 Fetching users with token:', token ? `Token: ${token.substring(0, 20)}...` : '❌ NO TOKEN');
    
    if (!token) {
      console.error('❌ No auth token found!');
      setUsers([]);
      return;
    }
    
    const res = await fetch(`${API_URL}/api/users`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    
    console.log('👥 Users response status:', res.status);
    const data = await res.json();
    console.log('👥 Users raw response:', data);
    
    if (!res.ok) {
      console.error('❌ Users fetch failed:', data);
      throw new Error(data.detail || 'Failed to fetch users');
    }
    
    if (Array.isArray(data)) {
      setUsers(data);
      console.log('✅ Users set successfully:', data.length, 'users');
    } else {
      console.error('❌ Users data is not an array:', data);
      setUsers([]);
    }
  } catch (e) { 
    console.error('❌ Error fetching users:', e);
    setUsers([]);
  }
};

const fetchDepartments = async () => {
  try {
    console.log('📡 Fetching departments from:', `${API_URL}/api/departments`);
    const res = await fetch(`${API_URL}/api/departments`);
    console.log('📊 Departments response status:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('✅ Departments received:', data);
    
    if (Array.isArray(data)) {
      setDepartments(data);
      console.log('✅ Departments state updated:', data.length, 'departments');
    } else {
      console.error('❌ Departments data is not an array:', data);
      setDepartments([]);
    }
  } catch (e) { 
    console.error('❌ Error fetching departments:', e);
    setDepartments([]);
  }
};

const fetchShoutouts = async () => {
  try {
    const token = localStorage.getItem('authToken');
    console.log('📢 Fetching shoutouts with token:', token ? 'Token exists' : '❌ NO TOKEN');
    
    if (!token) {
      console.error('❌ No auth token found!');
      setShoutouts([]);
      setFilteredShoutouts([]);
      return;
    }
    
    const res = await fetch(`${API_URL}/api/shoutouts`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    
    console.log('📢 Shoutouts response status:', res.status);
    const data = await res.json();
    console.log('📢 Shoutouts data received:', data);
    
    if (!res.ok) {
      console.error('❌ Shoutouts fetch failed:', data);
      throw new Error(data.detail || 'Failed to fetch shoutouts');
    }
    
    if (Array.isArray(data)) {
      setShoutouts(data);
      setFilteredShoutouts(data);
      console.log('✅ Shoutouts set successfully:', data.length, 'shoutouts');
    } else {
      console.error('❌ Shoutouts data is not an array:', data);
      setShoutouts([]);
      setFilteredShoutouts([]);
    }
  } catch (e) { 
    console.error('❌ Error fetching shoutouts:', e);
    setShoutouts([]);
    setFilteredShoutouts([]);
  }
};

  const applyFilters = () => {
    if (!Array.isArray(shoutouts) || !Array.isArray(users)) {
      setFilteredShoutouts([]);
      return;
    }
    
    let filtered = [...shoutouts];
    
    // Filter by view mode (all/sent/received)
    if (viewMode === 'sent' && userInfo) {
      filtered = filtered.filter(s => s.sender_id === userInfo.id);
    } else if (viewMode === 'received' && userInfo) {
      filtered = filtered.filter(s => s.recipients.some(r => r.id === userInfo.id));
    }
    
    // Filter by department
    if (filters.department_id) {
      filtered = filtered.filter(s => 
        (s.sender_id && users.find(u => u.id === s.sender_id)?.department_id === parseInt(filters.department_id)) || 
        s.recipients.some(r => r.department_id === parseInt(filters.department_id))
      );
    }
    
    // Filter by sender
    if (filters.sender_id) {
      filtered = filtered.filter(s => s.sender_id === parseInt(filters.sender_id));
    }
    
    // Filter by start date
    if (filters.start_date) {
      filtered = filtered.filter(s => new Date(s.created_at) >= new Date(filters.start_date));
    }
    
    // Filter by end date
    if (filters.end_date) {
      const ed = new Date(filters.end_date);
      ed.setHours(23, 59, 59);
      filtered = filtered.filter(s => new Date(s.created_at) <= ed);
    }
    
    // Search filter
    if (filters.search) {
      filtered = filtered.filter(s =>
        s.message.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.sender_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.recipients.some(r => r.username.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }
    
    // Sort
    if (filters.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    
    setFilteredShoutouts(filtered);
  };

 const handleSubmit = async () => {
  if (!formData.email || !formData.password) return setMessage({ type: 'error', text: 'Fill all fields' });
  if (!isLogin && !formData.username) return setMessage({ type: 'error', text: 'Enter username' });
  setLoading(true);
  setMessage({ type: '', text: '' }); // Clear previous messages
  
  try {
    if (isLogin) {
      console.log('🔐 Attempting login...');
      const res = await fetch(`${API_URL}/api/login`, { 
        method: 'POST', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({email:formData.email,password:formData.password}) 
      });
      
      const data = await res.json();
      console.log('📨 Login response:', data);
      
      if (!res.ok) throw new Error(data.detail);
      
      console.log('💾 Saving token:', data.access_token);
      localStorage.setItem('authToken', data.access_token);
      
      console.log('✅ Token saved, fetching user info...');
      const ur = await fetch(`${API_URL}/api/users/me`, { 
        headers: {Authorization:`Bearer ${data.access_token}`} 
      });
      
      console.log('👤 User info response status:', ur.status);
      const userData = await ur.json();
      console.log('👤 User data:', userData);
      
      if (!ur.ok) {
        throw new Error('Failed to fetch user info');
      }
      
      setUserInfo(userData);
      setMessage({type:'success',text:'Logged in!'});
      
      // Wait a bit before changing login state so token is fully set
      setTimeout(() => {
        console.log('🚀 Setting isLoggedIn to true');
        setIsLoggedIn(true);
      }, 500); // Changed from 1000 to 500ms
      
    } else {
      console.log('📝 Attempting registration...');
      const res = await fetch(`${API_URL}/api/register`, { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body:JSON.stringify({
          username:formData.username,
          email:formData.email,
          password:formData.password,
          role:formData.role,
          department_id:formData.department_id?parseInt(formData.department_id):null
        }) 
      });
      const data = await res.json();
      console.log('📨 Registration response:', data);
      
      if (!res.ok) throw new Error(data.detail);
      
      setMessage({type:'success',text:data.message});
      setTimeout(() => { 
        setIsLogin(true); 
        setFormData({...formData,password:'',username:''}); 
      }, 1500);
    }
  } catch (e) {
    console.error('❌ Auth error:', e);
    setMessage({type:'error',text:e.message});
  } finally {
    setLoading(false);
  }
};

  const handleSendShoutout = async (e) => {
  e.preventDefault();
  
  console.log('📝 Shoutout form data:', shoutoutForm);
  
  if (!shoutoutForm.message.trim()) {
    setMessage({type:'error',text:'Please enter a message'});
    return;
  }
  
  if (shoutoutForm.recipient_ids.length === 0) {
    setMessage({type:'error',text:'Please select at least one recipient'});
    return;
  }
  
  setLoading(true);
  setMessage({ type: '', text: '' });
  
  try {
    let imgUrl = null;
    
    // Upload image if selected
    if (selectedImage) {
      console.log('📤 Uploading image...');
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('file', selectedImage);
      const token = localStorage.getItem('authToken');
      
      const uploadRes = await fetch(`${API_URL}/api/upload-image`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` }, 
        body: fd 
      });
      
      console.log('📤 Upload response status:', uploadRes.status);
      
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        console.error('❌ Upload failed:', errorData);
        throw new Error('Image upload failed');
      }
      
      const uploadData = await uploadRes.json();
      imgUrl = uploadData.image_url;
      console.log('✅ Image uploaded:', imgUrl);
      setUploadingImage(false);
    }
    
    // Send shoutout
    const token = localStorage.getItem('authToken');
    console.log('📢 Sending shoutout...');
    console.log('📢 Token exists:', token ? 'Yes' : 'No');
    console.log('📢 Payload:', {
      message: shoutoutForm.message,
      recipient_ids: shoutoutForm.recipient_ids,
      image_url: imgUrl
    });
    
    const response = await fetch(`${API_URL}/api/shoutouts`, { 
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }, 
      body: JSON.stringify({
        message: shoutoutForm.message,
        recipient_ids: shoutoutForm.recipient_ids,
        image_url: imgUrl
      }) 
    });
    
    console.log('📢 Shoutout response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Shoutout failed:', errorData);
      throw new Error(errorData.detail || 'Failed to send shoutout');
    }
    
    const result = await response.json();
    console.log('✅ Shoutout sent successfully:', result);
    
    setMessage({type:'success',text:'Shoutout sent! 🎉'});
    setShoutoutForm({message:'',recipient_ids:[],image_url:''});
    setSelectedImage(null);
    setImagePreview(null);
    
    // Reload shoutouts
    await fetchShoutouts();
    
  } catch (e) {
    console.error('❌ Error sending shoutout:', e);
    setMessage({type:'error',text: e.message || 'Failed to send shoutout'});
  } finally {
    setLoading(false);
    setUploadingImage(false);
  }
};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  if (isLoggedIn && userInfo) {
    const stats = [
      { label: 'Total Users', value: Array.isArray(users) ? users.length : 0, icon: Users, color: 'bg-blue-500' },
      { label: 'Dept Users', value: Array.isArray(users) ? users.filter(u=>u.department_id===userInfo.department_id).length : 0, icon: Building2, color: 'bg-purple-500' },
      { label: 'Received', value: Array.isArray(shoutouts) ? shoutouts.filter(s=>s.recipients.some(r=>r.id===userInfo.id)).length : 0, icon: MessageSquare, color: 'bg-green-500' },
      { label: 'Sent', value: Array.isArray(shoutouts) ? shoutouts.filter(s=>s.sender_id===userInfo.id).length : 0, icon: Send, color: 'bg-orange-500' },
    ];

    const menu = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'shoutouts', label: 'Shoutouts', icon: MessageSquare },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'department', label: 'My Department', icon: Building2 },
    ];

    return (
      <div className="flex h-screen bg-gray-50 animate-fade-in">
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slide-in {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slide-down {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes scale-in {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
          .animate-slide-in {
            animation: slide-in 0.5s ease-out forwards;
          }
          .animate-slide-down {
            animation: slide-down 0.5s ease-out forwards;
          }
          .animate-scale-in {
            animation: scale-in 0.5s ease-out forwards;
          }
        `}</style>
        
        <aside className={`${sidebarOpen?'w-64':'w-20'} bg-gradient-to-b from-indigo-600 to-purple-700 text-white transition-all duration-300 flex flex-col shadow-2xl`}>
          <div className="p-6 flex items-center justify-between border-b border-white border-opacity-20">
            {sidebarOpen && <h2 className="text-2xl font-bold animate-slide-in">BragBoard</h2>}
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200 hover:scale-110">
              {sidebarOpen?<X className="w-5 h-5"/>:<Menu className="w-5 h-5"/>}
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {menu.map((item, index)=>(
              <button key={item.id} onClick={()=>setActiveTab(item.id)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${activeTab===item.id?'bg-white bg-opacity-20 shadow-lg':'hover:bg-white hover:bg-opacity-10'}`}
                style={{animationDelay: `${index * 100}ms`}}>
                <item.icon className="w-5 h-5"/>{sidebarOpen&&<span className="animate-fade-in">{item.label}</span>}
              </button>
            ))}
          </nav>
          <button onClick={()=>{setIsLoggedIn(false);localStorage.removeItem('authToken');setUserInfo(null);setUsers([]);setShoutouts([]);}} 
            className="m-4 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg flex items-center gap-3 transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
            <LogOut className="w-5 h-5"/>{sidebarOpen&&<span>Logout</span>}
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 animate-slide-down">
            <h1 className="text-2xl font-bold text-gray-800">{menu.find(i=>i.id===activeTab)?.label}</h1>
            <p className="text-sm text-gray-600">Welcome, {userInfo.username}!</p>
          </header>

          <div className="p-6">
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl flex gap-3 animate-slide-down ${message.type==='success'?'bg-green-50 border border-green-200':'bg-red-50 border border-red-200'}`}>
                {message.type==='success'?<CheckCircle className="w-5 h-5 text-green-600"/>:<AlertCircle className="w-5 h-5 text-red-600"/>}
                <span className={message.type==='success'?'text-green-800':'text-red-800'}>{message.text}</span>
              </div>
            )}

            {activeTab==='overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((s,i)=>(
                    <div key={i} className="bg-white rounded-xl shadow-sm p-6 transform hover:scale-105 transition-all duration-200 hover:shadow-lg animate-fade-in" style={{animationDelay: `${i * 100}ms`}}>
                      <div className={`w-12 h-12 ${s.color} rounded-lg flex items-center justify-center mb-3 transform transition-transform duration-200 hover:rotate-12`}>
                        <s.icon className="w-6 h-6 text-white"/>
                      </div>
                      <h3 className="text-3xl font-bold">{s.value}</h3>
                      <p className="text-sm text-gray-600">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in" style={{animationDelay: '400ms'}}>
  <h3 className="text-xl font-bold mb-4">Profile</h3>
  <div className="space-y-3">
    <div className="transform hover:translate-x-2 transition-transform duration-200 p-3 rounded-lg hover:bg-gray-50">
      <p className="text-sm text-gray-600 mb-1">Username</p>
      <p className="font-semibold text-gray-900">{userInfo?.username || 'Not Available'}</p>
    </div>
    <div className="transform hover:translate-x-2 transition-transform duration-200 p-3 rounded-lg hover:bg-gray-50">
      <p className="text-sm text-gray-600 mb-1">Email</p>
      <p className="font-semibold text-gray-900">{userInfo?.email || 'Not Available'}</p>
    </div>
    <div className="transform hover:translate-x-2 transition-transform duration-200 p-3 rounded-lg hover:bg-gray-50">
      <p className="text-sm text-gray-600 mb-1">Role</p>
      <p className="font-semibold text-gray-900 capitalize">{userInfo?.role || 'Not Available'}</p>
    </div>
    <div className="transform hover:translate-x-2 transition-transform duration-200 p-3 rounded-lg hover:bg-gray-50">
      <p className="text-sm text-gray-600 mb-1">Department</p>
      <p className="font-semibold text-gray-900">{userInfo?.department_name || 'Not Assigned'}</p>
    </div>
  </div>
</div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in" style={{animationDelay: '500ms'}}>
                  <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {Array.isArray(shoutouts) && shoutouts.slice(0, 5).map((s, index) => (
                      <div key={s.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all animate-slide-in" style={{animationDelay: `${600 + index * 50}ms`}}>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{s.sender_name[0].toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{s.sender_name}</p>
                          <p className="text-sm text-gray-600 truncate">{s.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(s.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab==='shoutouts' && (
              <div className="animate-fade-in">
                <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={()=>setViewMode('all')} 
                        className={`px-4 py-2 rounded-lg transition-all transform hover:scale-105 ${viewMode==='all'?'bg-indigo-600 text-white shadow-lg':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        All Shoutouts
                      </button>
                      <button 
                        onClick={()=>setViewMode('received')} 
                        className={`px-4 py-2 rounded-lg transition-all transform hover:scale-105 ${viewMode==='received'?'bg-green-600 text-white shadow-lg':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        Received
                      </button>
                      <button 
                        onClick={()=>setViewMode('sent')} 
                        className={`px-4 py-2 rounded-lg transition-all transform hover:scale-105 ${viewMode==='sent'?'bg-orange-600 text-white shadow-lg':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        Sent
                      </button>
                    </div>
                    
                    <button onClick={()=>setShowFilters(!showFilters)} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all duration-200 transform hover:scale-105 flex items-center gap-2">
                      <Filter className="w-4 h-4"/>{showFilters?'Hide Filters':'Show Filters'}
                    </button>
                  </div>
                  
                  {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg animate-slide-down">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Search className="w-4 h-4"/>Search
                        </label>
                        <input 
                          type="text" 
                          name="search" 
                          value={filters.search} 
                          onChange={e=>setFilters({...filters,search:e.target.value})} 
                          placeholder="Search messages..." 
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"/>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Building2 className="w-4 h-4"/>Department
                        </label>
                        <select 
                          name="department_id" 
                          value={filters.department_id} 
                          onChange={e=>setFilters({...filters,department_id:e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 transition-all">
                          <option value="">All Departments</option>
                          {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <User className="w-4 h-4"/>Sender
                        </label>
                        <select 
                          name="sender_id" 
                          value={filters.sender_id} 
                          onChange={e=>setFilters({...filters,sender_id:e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 transition-all">
                          <option value="">All Senders</option>
                          {users.map(user=><option key={user.id} value={user.id}>{user.username}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4"/>Sort By
                        </label>
                        <select 
                          name="sortBy" 
                          value={filters.sortBy} 
                          onChange={e=>setFilters({...filters,sortBy:e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 transition-all">
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4"/>Start Date
                        </label>
                        <input 
                          type="date" 
                          name="start_date" 
                          value={filters.start_date} 
                          onChange={e=>setFilters({...filters,start_date:e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"/>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4"/>End Date
                        </label>
                        <input 
                          type="date" 
                          name="end_date" 
                          value={filters.end_date} 
                          onChange={e=>setFilters({...filters,end_date:e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"/>
                      </div>
                      
                      <div className="md:col-span-2 flex items-end">
                        <button 
                          onClick={()=>setFilters({department_id:'',sender_id:'',start_date:'',end_date:'',search:'',sortBy:'newest'})} 
                          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all transform hover:scale-105">
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <p className="text-gray-600">
                      Showing <span className="font-bold text-indigo-600">{filteredShoutouts.length}</span> of <span className="font-bold">{shoutouts.length}</span> shoutouts
                      {viewMode!=='all' && <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">{viewMode}</span>}
                    </p>
                    {(filters.department_id || filters.sender_id || filters.search || filters.start_date || filters.end_date) && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Filter className="w-3 h-3"/>Filters Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6 animate-slide-in">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Send className="w-5 h-5"/>Send Shoutout
                    </h3>
                    <form onSubmit={handleSendShoutout} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                        <textarea 
                          value={shoutoutForm.message} 
                          onChange={e=>setShoutoutForm({...shoutoutForm,message:e.target.value})} 
                          className="w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 transition-all" 
                          rows="4" 
                          placeholder="Share your appreciation..."/>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image (Optional)</label>
                        <input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(f){setSelectedImage(f);setImagePreview(URL.createObjectURL(f));}}} id="img" className="hidden"/>
                        {!imagePreview?<label htmlFor="img" className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 transition-all transform hover:scale-105"><ImageIcon className="w-5 h-5 text-gray-400"/><span className="text-gray-600">Add an image</span></label>:<div className="relative animate-fade-in"><img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg"/><button type="button" onClick={()=>{setSelectedImage(null);setImagePreview(null);}} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all transform hover:scale-110"><XIcon className="w-4 h-4"/></button></div>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Recipients ({shoutoutForm.recipient_ids.length} selected)</label>
                        <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-2">
                          {Array.isArray(users) && users.filter(u=>u.id!==userInfo.id).map(u=>(
                            <label key={u.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-102 ${shoutoutForm.recipient_ids.includes(u.id)?'bg-purple-50 border-2 border-purple-300':'hover:bg-gray-50 border-2 border-transparent'}`}>
                              <input type="checkbox" checked={shoutoutForm.recipient_ids.includes(u.id)} onChange={()=>setShoutoutForm(p=>({...p,recipient_ids:p.recipient_ids.includes(u.id)?p.recipient_ids.filter(i=>i!==u.id):[...p.recipient_ids,u.id]}))} className="w-4 h-4"/>
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-xs">{u.username[0].toUpperCase()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{u.username}</p>
                                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <button type="submit" disabled={loading || uploadingImage} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
                        <Send className="w-4 h-4"/>{uploadingImage ? 'Uploading Image...' : loading ? 'Sending...' : 'Send Shoutout'}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 animate-fade-in">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5"/>Feed - {viewMode === 'all' ? 'All Shoutouts' : viewMode === 'sent' ? 'Sent by You' : 'Received by You'} ({filteredShoutouts.length})
                    </h3>
                    <div className="space-y-4">
                      {Array.isArray(filteredShoutouts) && filteredShoutouts.length > 0 ? filteredShoutouts.map((s,index)=>(
                        <div key={s.id} className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 transform hover:scale-102 animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                          <div className="flex gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 transform transition-transform hover:rotate-12">
                              <span className="text-white font-bold text-lg">{s.sender_name[0].toUpperCase()}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-semibold text-gray-900">{s.sender_name}</span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3"/>{formatDate(s.created_at)}
                                </span>
                                {s.sender_id === userInfo.id && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">You sent this</span>
                                )}
                                {s.recipients.some(r=>r.id===userInfo.id) && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">You received this</span>
                                )}
                              </div>
                              <p className="text-gray-700 mb-3 leading-relaxed">{s.message}</p>
                              {s.image_url && (
                                <div className="mb-3">
                                  <img src={`${API_URL}${s.image_url}`} alt="Shoutout" className="max-w-md w-full rounded-lg transform hover:scale-105 transition-transform shadow-md"/>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Tag className="w-3 h-3"/>To:
                                </span>
                                {s.recipients.map(r=>(
                                  <span key={r.id} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full transform hover:scale-110 transition-transform font-medium">
                                    @{r.username}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12">
                          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                          <p className="text-gray-500 text-lg font-medium">No shoutouts found</p>
                          <p className="text-gray-400 text-sm mt-2">
                            {viewMode === 'sent' ? "You haven't sent any shoutouts yet" : 
                             viewMode === 'received' ? "You haven't received any shoutouts yet" : 
                             "Try adjusting your filters"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab==='users' && (
              <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5"/>All Users ({users.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Array.isArray(users) && users.map((u,index)=>(
                        <tr key={u.id} className="hover:bg-gray-50 transition-all animate-slide-in" style={{animationDelay: `${index * 30}ms`}}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center transform hover:rotate-12 transition-transform">
                                <span className="text-white font-semibold">{u.username[0].toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{u.username}</p>
                                {u.id === userInfo.id && (
                                  <span className="text-xs text-purple-600 font-medium">(You)</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold transform hover:scale-110 transition-transform inline-block ${u.role==='admin'?'bg-red-100 text-red-800':u.role==='manager'?'bg-blue-100 text-blue-800':'bg-green-100 text-green-800'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400"/>
                              <span className="text-sm text-gray-600">{u.department_name||'N/A'}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab==='department' && (
              <div className="animate-fade-in space-y-6">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Building2 className="w-8 h-8"/>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{userInfo.department_name||'No Department Assigned'}</h3>
                      <p className="text-white text-opacity-80">
                        {Array.isArray(users) && users.filter(u=>u.department_id===userInfo.department_id).length} members
                      </p>
                    </div>
                  </div>
                </div>

                {userInfo.department_id ? (
                  <>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5"/>Department Members
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.isArray(users) && users.filter(u=>u.department_id===userInfo.department_id).map((u,index)=>(
                          <div key={u.id} className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 transform hover:scale-105 animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center transform hover:rotate-12 transition-transform">
                                <span className="text-white font-bold text-lg">{u.username[0].toUpperCase()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{u.username}</p>
                                <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                                {u.id === userInfo.id && (
                                  <span className="text-xs text-purple-600 font-medium">(You)</span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{u.email}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5"/>Department Shoutouts
                      </h4>
                      <div className="space-y-3">
                        {Array.isArray(shoutouts) && 
                          shoutouts
                            .filter(s => {
                              const senderInDept = users.find(u => u.id === s.sender_id)?.department_id === userInfo.department_id;
                              const recipientInDept = s.recipients.some(r => r.department_id === userInfo.department_id);
                              return senderInDept || recipientInDept;
                            })
                            .slice(0, 5)
                            .map((s, index) => (
                              <div key={s.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-all animate-slide-in" style={{animationDelay: `${index * 50}ms`}}>
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-sm">{s.sender_name[0].toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-medium text-gray-900">{s.sender_name}</p>
                                    <span className="text-xs text-gray-400">{formatDate(s.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 truncate">{s.message}</p>
                                  <div className="flex gap-1 mt-1">
                                    {s.recipients.slice(0, 3).map(r => (
                                      <span key={r.id} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">@{r.username}</span>
                                    ))}
                                    {s.recipients.length > 3 && (
                                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">+{s.recipients.length - 3}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                        }
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Department Assigned</h4>
                    <p className="text-gray-500">You haven't been assigned to a department yet. Contact your administrator.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden flex items-center justify-center p-4">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out forwards;
        }
        .animate-slide-down {
          animation: slide-down 0.5s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-300 opacity-20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-300 opacity-10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="bg-white bg-opacity-10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white border-opacity-20 p-8 transform transition-all duration-300 hover:shadow-3xl">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full mb-4 transform transition-transform hover:scale-110 hover:rotate-12 duration-300 animate-float">
              <MessageSquare className="w-10 h-10 text-white"/>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{isLogin?'Welcome Back':'Join BragBoard'}</h1>
            <p className="text-white text-opacity-80">{isLogin?'Sign in to share appreciation':'Create your account to get started'}</p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 animate-slide-down ${message.type==='success'?'bg-green-500 bg-opacity-20 border border-green-400 border-opacity-30':'bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30'}`}>
              {message.type==='success'?<CheckCircle className="w-5 h-5 text-green-300"/>:<AlertCircle className="w-5 h-5 text-red-300"/>}
              <span className="text-sm text-white">{message.text}</span>
            </div>
          )}

          <div className="space-y-5">
            {!isLogin && (
              <>
                <div className="animate-slide-in" style={{animationDelay: '100ms'}}>
                  <label className="block text-sm font-medium text-white text-opacity-90 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4"/>Username
                  </label>
                  <input type="text" name="username" value={formData.username} onChange={e=>setFormData({...formData,username:e.target.value})} className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all transform focus:scale-105" placeholder="Choose a username"/>
                </div>
                <div className="animate-slide-in" style={{animationDelay: '200ms'}}>
                  <label className="block text-sm font-medium text-white text-opacity-90 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4"/>Role
                  </label>
                  <select name="role" value={formData.role} onChange={e=>setFormData({...formData,role:e.target.value})} className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all transform focus:scale-105">
                    <option value="employee" className="text-gray-900">Employee</option>
                    <option value="manager" className="text-gray-900">Manager</option>
                    <option value="admin" className="text-gray-900">Admin</option>
                  </select>
                </div>
                <div className="animate-slide-in" style={{animationDelay: '300ms'}}>
                  <label className="block text-sm font-medium text-white text-opacity-90 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4"/>Department (Optional)
                  </label>
                  <select name="department_id" value={formData.department_id} onChange={e=>setFormData({...formData,department_id:e.target.value})} className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all transform focus:scale-105">
                    <option value="" className="text-gray-900">Select a department</option>
                    {Array.isArray(departments) && departments.map(d=><option key={d.id} value={d.id} className="text-gray-900">{d.name}</option>)}
                  </select>
                  {departments.length === 0 && (
                    <p className="text-xs text-white text-opacity-60 mt-1">Loading departments...</p>
                  )}
                </div>
              </>
            )}
            
            <div className="animate-slide-in" style={{animationDelay: isLogin?'100ms':'400ms'}}>
              <label className="block text-sm font-medium text-white text-opacity-90 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4"/>Email Address
              </label>
              <input type="email" name="email" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all transform focus:scale-105" placeholder="Enter your email"/>
            </div>
            
            <div className="animate-slide-in" style={{animationDelay: isLogin?'200ms':'500ms'}}>
              <label className="block text-sm font-medium text-white text-opacity-90 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4"/>Password
              </label>
              <div className="relative">
                <input type={showPassword?'text':'password'} name="password" value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})} className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-12 transition-all transform focus:scale-105" placeholder="Enter your password"/>
                <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-opacity-60 hover:text-opacity-100 transition-all transform hover:scale-110">
                  {showPassword?<EyeOff className="w-5 h-5"/>:<Eye className="w-5 h-5"/>}
                </button>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 mt-6 transform hover:scale-105 disabled:hover:scale-100 animate-fade-in flex items-center justify-center gap-2" style={{animationDelay: isLogin?'300ms':'600ms'}}>
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>{isLogin?'Sign In':'Create Account'}</>
              )}
            </button>
          </div>

          <div className="mt-6 text-center animate-fade-in" style={{animationDelay: isLogin?'400ms':'700ms'}}>
            <p className="text-white text-opacity-80">{isLogin?"Don't have an account?":'Already have an account?'}</p>
            <button onClick={()=>{setIsLogin(!isLogin);setMessage({type:'',text:''});}} className="mt-2 text-white font-semibold hover:text-pink-300 underline decoration-2 underline-offset-4 transition-all transform hover:scale-110 inline-block">
              {isLogin?'Sign up for free':'Sign in instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BragBoardApp;