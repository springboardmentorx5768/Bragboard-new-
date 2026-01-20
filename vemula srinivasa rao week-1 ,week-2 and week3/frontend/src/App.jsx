import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Sparkles, Star, Mail, Lock, User, Zap, LayoutDashboard, Users, Building2, Award, TrendingUp, LogOut, Menu, X, Bell, Settings, Plus, Heart, MessageCircle, Send, Tag, Calendar, ThumbsUp } from 'lucide-react';

const BragBoardApp = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: 'employee',
    department_id: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Week 3: Shout-out states
  const [showShoutoutModal, setShowShoutoutModal] = useState(false);
  const [shoutouts, setShoutouts] = useState([]);
  const [newShoutout, setNewShoutout] = useState({
    content: '',
    tagged_users: []
  });
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  
  // Departments and users from API
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch departments when component mounts
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      console.log('🔍 Fetching departments from backend...');
      const response = await fetch('http://localhost:8000/api/departments');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Departments loaded:', data);
        setDepartments(data);
      } else {
        console.error('❌ Failed to fetch departments. Status:', response.status);
        // Use fallback data
        setDepartments([
          { id: 1, name: 'Engineering', description: 'Software development team' },
          { id: 2, name: 'Marketing', description: 'Marketing and sales team' },
          { id: 3, name: 'HR', description: 'Human resources team' },
          { id: 4, name: 'Finance', description: 'Finance and accounting team' }
        ]);
      }
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
      // Use fallback data
      setDepartments([
        { id: 1, name: 'Engineering', description: 'Software development team' },
        { id: 2, name: 'Marketing', description: 'Marketing and sales team' },
        { id: 3, name: 'HR', description: 'Human resources team' },
        { id: 4, name: 'Finance', description: 'Finance and accounting team' }
      ]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/users');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Users loaded:', data);
        setUsers(data);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      // Use mock data
      setUsers([
        { id: 1, username: 'admin', email: 'admin@bragboard.com', role: 'admin', department_id: 1, department_name: 'Engineering' },
        { id: 2, username: 'john_manager', email: 'john@bragboard.com', role: 'manager', department_id: 1, department_name: 'Engineering' },
        { id: 3, username: 'jane', email: 'jane@bragboard.com', role: 'employee', department_id: 2, department_name: 'Marketing' },
        { id: 4, username: 'mike', email: 'mike@bragboard.com', role: 'employee', department_id: 3, department_name: 'HR' }
      ]);
    }
  };

  // Fetch users when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchUsers();
    }
  }, [isLoggedIn]);

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }
    
    if (!isLogin && !formData.username) {
      setMessage({ type: 'error', text: 'Please enter a username' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      if (isLogin) {
        const user = users.find(u => u.email === formData.email);
        if (user) {
          setMessage({ type: 'success', text: 'Successfully logged in!' });
          setUserInfo(user);
          setTimeout(() => {
            setIsLoggedIn(true);
          }, 1000);
        } else {
          setMessage({ type: 'error', text: 'User not found. Try: admin@bragboard.com' });
        }
      } else {
        const userExists = users.some(u => u.email === formData.email);
        if (userExists) {
          setMessage({ type: 'error', text: 'Email already registered' });
        } else {
          const deptName = departments.find(d => d.id === parseInt(formData.department_id))?.name || null;
          const newUser = {
            id: users.length + 1,
            username: formData.username,
            email: formData.email,
            role: formData.role,
            department_id: formData.department_id ? parseInt(formData.department_id) : null,
            department_name: deptName
          };
          setUsers([...users, newUser]);
          setMessage({ type: 'success', text: 'Registration successful! You can now log in.' });
          setTimeout(() => {
            setIsLogin(true);
            setFormData({ email: formData.email, password: '', username: '', role: 'employee', department_id: '' });
          }, 1500);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setFormData({ email: '', password: '', username: '', role: 'employee', department_id: '' });
    setMessage({ type: '', text: '' });
    setUserInfo(null);
  };

  const handleCreateShoutout = () => {
    if (!newShoutout.content.trim()) {
      setMessage({ type: 'error', text: 'Please enter shout-out content' });
      return;
    }

    const taggedNames = newShoutout.tagged_users.map(id => 
      users.find(u => u.id === id)?.username
    ).filter(Boolean);

    const shoutout = {
      id: shoutouts.length + 1,
      author_id: userInfo.id,
      author_name: userInfo.username,
      content: newShoutout.content,
      tagged_users: newShoutout.tagged_users,
      tagged_names: taggedNames,
      likes: 0,
      comments: 0,
      created_at: new Date().toISOString(),
      liked_by: []
    };

    setShoutouts([shoutout, ...shoutouts]);
    setNewShoutout({ content: '', tagged_users: [] });
    setShowShoutoutModal(false);
    setMessage({ type: 'success', text: 'Shout-out posted successfully!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const toggleTag = (userId) => {
    if (newShoutout.tagged_users.includes(userId)) {
      setNewShoutout({
        ...newShoutout,
        tagged_users: newShoutout.tagged_users.filter(id => id !== userId)
      });
    } else {
      setNewShoutout({
        ...newShoutout,
        tagged_users: [...newShoutout.tagged_users, userId]
      });
    }
  };

  const handleLike = (shoutoutId) => {
    setShoutouts(shoutouts.map(s => {
      if (s.id === shoutoutId) {
        const hasLiked = s.liked_by.includes(userInfo.id);
        return {
          ...s,
          likes: hasLiked ? s.likes - 1 : s.likes + 1,
          liked_by: hasLiked 
            ? s.liked_by.filter(id => id !== userInfo.id)
            : [...s.liked_by, userInfo.id]
        };
      }
      return s;
    }));
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
    const departmentUsers = users.filter(u => u.department_id === userInfo.department_id);
    const userShoutouts = shoutouts.filter(s => 
      s.author_id === userInfo.id || s.tagged_users.includes(userInfo.id)
    );
    
    const stats = [
      { label: 'Total Shout-outs', value: shoutouts.length, icon: Award, color: 'bg-blue-500', trend: '+12%' },
      { label: 'Your Shout-outs', value: userShoutouts.length, icon: Star, color: 'bg-purple-500', trend: '+8%' },
      { label: 'Total Likes', value: shoutouts.reduce((sum, s) => sum + s.likes, 0), icon: Heart, color: 'bg-pink-500', trend: '+23%' },
      { label: 'Engagement', value: '87%', icon: TrendingUp, color: 'bg-orange-500', trend: '+5%' },
    ];

    const menuItems = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'achievements', label: 'Shout-outs', icon: Award },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'department', label: 'My Department', icon: Building2 },
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        {showShoutoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">Create Shout-out</h3>
                  <button onClick={() => setShowShoutoutModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What's the shout-out about? 🎉
                  </label>
                  <textarea
                    value={newShoutout.content}
                    onChange={(e) => setNewShoutout({ ...newShoutout, content: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows="4"
                    placeholder="Give recognition to your amazing teammates..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Team Members
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowTagDropdown(!showTagDropdown)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between hover:border-purple-500 transition"
                    >
                      <span className="text-gray-600">
                        {newShoutout.tagged_users.length > 0 
                          ? `${newShoutout.tagged_users.length} user(s) tagged`
                          : 'Select users to tag'}
                      </span>
                      <Tag className="w-5 h-5 text-gray-400" />
                    </button>

                    {showTagDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                        {users.filter(u => u.id !== userInfo.id).map(user => (
                          <button
                            key={user.id}
                            onClick={() => toggleTag(user.id)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">{user.username[0].toUpperCase()}</span>
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900">{user.username}</p>
                                <p className="text-xs text-gray-500">{user.department_name || 'No dept'}</p>
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                              newShoutout.tagged_users.includes(user.id)
                                ? 'bg-purple-500 border-purple-500'
                                : 'border-gray-300'
                            }`}>
                              {newShoutout.tagged_users.includes(user.id) && (
                                <CheckCircle className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {newShoutout.tagged_users.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {newShoutout.tagged_users.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return (
                          <span key={userId} className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                            @{user?.username}
                            <button onClick={() => toggleTag(userId)} className="hover:text-purple-600">
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowShoutoutModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateShoutout}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg transition"
                >
                  Post Shout-out
                </button>
              </div>
            </div>
          </div>
        )}

        <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-indigo-600 to-purple-700 text-white transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
          <div className="p-4 flex items-center justify-between border-b border-white border-opacity-20">
            {sidebarOpen && <h1 className="text-2xl font-bold">BragBoard</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <nav className="mt-8 space-y-2 px-3">
            {menuItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-white bg-opacity-20 shadow-lg' : 'hover:bg-white hover:bg-opacity-10'}`}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white border-opacity-20">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500 hover:bg-opacity-20 transition">
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="px-8 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{menuItems.find(item => item.id === activeTab)?.label}</h2>
                <p className="text-sm text-gray-500 mt-1">Welcome back, {userInfo.username}!</p>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-3 pl-4 border-l">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{userInfo.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{userInfo.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="p-8">
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                <span className="text-sm text-gray-800">{message.text}</span>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6" style={{animation: `fadeIn 0.5s ease-out ${index * 0.1}s forwards`, opacity: 0}}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`${stat.color} p-3 rounded-lg`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-green-600 text-sm font-semibold">{stat.trend}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                      <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
                  <h3 className="text-xl font-bold mb-4">Your Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white text-opacity-80 text-sm">Username</p>
                      <p className="font-semibold text-lg">{userInfo.username}</p>
                    </div>
                    <div>
                      <p className="text-white text-opacity-80 text-sm">Email</p>
                      <p className="font-semibold text-lg">{userInfo.email}</p>
                    </div>
                    <div>
                      <p className="text-white text-opacity-80 text-sm">Role</p>
                      <p className="font-semibold text-lg capitalize">{userInfo.role}</p>
                    </div>
                    <div>
                      <p className="text-white text-opacity-80 text-sm">Department</p>
                      <p className="font-semibold text-lg">{userInfo.department_name || 'Not Assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Team Shout-outs</h3>
                    <p className="text-sm text-gray-500 mt-1">Celebrate wins and recognize great work</p>
                  </div>
                  <button
                    onClick={() => setShowShoutoutModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg transition"
                  >
                    <Plus className="w-5 h-5" />
                    New Shout-out
                  </button>
                </div>

                <div className="space-y-4">
                  {shoutouts.map((shoutout) => (
                    <div key={shoutout.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">{shoutout.author_name[0].toUpperCase()}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{shoutout.author_name}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(shoutout.created_at)}
                              </p>
                            </div>
                          </div>

                          <p className="text-gray-800 mb-3 leading-relaxed">{shoutout.content}</p>

                          {shoutout.tagged_names.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {shoutout.tagged_names.map((name, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                                  <Tag className="w-3 h-3" />
                                  @{name}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => handleLike(shoutout.id)}
                              className={`flex items-center gap-2 transition ${
                                shoutout.liked_by.includes(userInfo.id)
                                  ? 'text-pink-500'
                                  : 'text-gray-500 hover:text-pink-500'
                              }`}
                            >
                              <Heart className={`w-5 h-5 ${shoutout.liked_by.includes(userInfo.id) ? 'fill-current' : ''}`} />
                              <span className="text-sm font-medium">{shoutout.likes}</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition">
                              <MessageCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">{shoutout.comments}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {shoutouts.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl">
                      <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No shout-outs yet</p>
                      <p className="text-gray-400 text-sm mt-2">Be the first to recognize someone's great work!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">All Users ({users.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">{u.username[0].toUpperCase()}</span>
                              </div>
                              <span className="font-medium text-gray-900">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-red-100 text-red-800' : u.role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{u.department_name || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'department' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{userInfo.department_name || 'No Department Assigned'}</h3>
                {departmentUsers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departmentUsers.map((u) => (
                      <div key={u.id} className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">{u.username[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{u.username}</p>
                            <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{u.email}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No department assigned yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-yellow-300 opacity-20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-pink-400 opacity-20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="absolute top-10 right-20 animate-float"><Sparkles className="w-8 h-8 text-yellow-300 opacity-60" /></div>
        <div className="absolute top-1/4 left-10 animate-float" style={{animationDelay: '1s'}}><Star className="w-6 h-6 text-pink-300 opacity-60" fill="currentColor" /></div>
        <div className="absolute bottom-1/4 right-1/4 animate-float" style={{animationDelay: '2s'}}><Zap className="w-7 h-7 text-purple-300 opacity-60" /></div>
        <div className="absolute bottom-10 left-1/4 animate-float" style={{animationDelay: '0.5s'}}><Star className="w-5 h-5 text-yellow-200 opacity-60" fill="currentColor" /></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
        
        <div className="relative bg-white bg-opacity-10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white border-opacity-20 p-8 transform transition-all duration-500 hover:scale-105">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full mb-4 animate-bounce">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Join Us'}</h1>
            <p className="text-white text-opacity-80">{isLogin ? 'Sign in to continue' : 'Create your account'}</p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-500 bg-opacity-20 border border-green-400 border-opacity-30' : 'bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30'}`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-300" /> : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-300" />}
              <span className="text-sm text-white">{message.text}</span>
            </div>
          )}

          <div className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white text-opacity-90 mb-2">Username</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white text-opacity-60 group-focus-within:text-pink-400 transition-colors" />
                    <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all" placeholder="Choose a username" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white text-opacity-90 mb-2">Role</label>
                  <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all">
                    <option value="employee" className="text-gray-900">Employee</option>
                    <option value="manager" className="text-gray-900">Manager</option>
                    <option value="admin" className="text-gray-900">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white text-opacity-90 mb-2">
                    Department (Optional) 
                    {departments.length === 0 && <span className="text-xs ml-2">Loading...</span>}
                  </label>
                  <select 
                    name="department_id" 
                    value={formData.department_id} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
                    disabled={departments.length === 0}
                  >
                    <option value="" className="text-gray-900">None</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id} className="text-gray-900">{dept.name}</option>
                    ))}
                  </select>
                  {departments.length > 0 && (
                    <p className="text-xs text-white text-opacity-60 mt-1">✓ {departments.length} departments loaded</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-white text-opacity-90 mb-2">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white text-opacity-60 group-focus-within:text-purple-400 transition-colors" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all" placeholder="Enter your email" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white text-opacity-90 mb-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white text-opacity-60 group-focus-within:text-indigo-400 transition-colors" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full pl-12 pr-12 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-opacity-60 hover:text-opacity-100 transition-all">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6">
              {loading ? <span className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Processing...</span> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white text-opacity-80">{isLogin ? "Don't have an account?" : 'Already have an account?'}</p>
            <button onClick={() => { setIsLogin(!isLogin); setMessage({ type: '', text: '' }); setFormData({ email: '', password: '', username: '', role: 'employee', department_id: '' }); }} className="mt-2 text-white font-semibold hover:text-pink-300 transition-colors underline decoration-2 underline-offset-4 decoration-pink-400">
              {isLogin ? 'Sign up for free' : 'Sign in instead'}
            </button>
          </div>

          {isLogin && (
            <div className="mt-6 p-4 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
              <p className="text-xs text-white text-opacity-80 text-center mb-2">Demo Accounts:</p>
              <p className="text-xs text-white font-mono">admin@bragboard.com</p>
              <p className="text-xs text-white font-mono">john@bragboard.com</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default BragBoardApp;