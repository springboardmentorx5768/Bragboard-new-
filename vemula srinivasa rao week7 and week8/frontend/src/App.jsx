import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, CheckCircle, Eye, EyeOff, User, LayoutDashboard, Users, 
  Building2, MessageSquare, LogOut, Send, Mail, Lock, 
  Loader2, Tag, ThumbsUp, Sparkles, Star, MessageCircle,
  UserCircle, Image as ImageIcon, Heart, TrendingUp, Award,
  Zap, Trophy, Filter, Calendar, Clock, Search, ChevronRight,
  Bell, Settings, Home, TrendingUp as TrendingUpIcon,
  BarChart3, Activity, Award as AwardIcon, MoreVertical,
  Edit, Trash2, Reply, ChevronDown, ChevronUp, Smile,
  Check, X, Shield, Flag, Crown, Download, AlertTriangle,
  FileText, BarChart, PieChart, Target, TrendingDown,
  Star as StarIcon, RefreshCw, Shield as ShieldIcon,
  FileSpreadsheet, Printer, UserCheck, UserX, Filter as FilterIcon,
  Award as TrophyIcon, Medal, TrendingUp as TrendingUpIcon2,
  LineChart, DownloadCloud, Eye as EyeIcon, Ban,
  CheckSquare, XSquare, AlertOctagon, ClipboardList, FileDown,
  BarChart2, TrendingUp as TrendingUpIcon3, ExternalLink,
  ShieldCheck, AlertTriangle as AlertTriangleIcon
} from 'lucide-react';

// Use the correct API URL
const API_URL = 'http://localhost:8000';

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
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shoutouts, setShoutouts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Admin states
  const [reportedShoutouts, setReportedShoutouts] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Shoutout form state
  const [newShoutout, setNewShoutout] = useState({
    message: '',
    recipient_ids: [],
    image_url: ''
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [commentLoading, setCommentLoading] = useState({});
  
  // Filters
  const [filters, setFilters] = useState({
    department_id: '',
    search: '',
    sortBy: 'newest'
  });

  // Report states
  const [reportReason, setReportReason] = useState('');
  const [reportingShoutout, setReportingShoutout] = useState(null);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: -300, opacity: 0 }
  };

  // Check for existing token on initial load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      validateToken(token);
    }
    fetchDepartments();
  }, []);

  // Fetch data when logged in
  useEffect(() => {
    if (isLoggedIn && userInfo) {
      fetchUsers();
      fetchShoutouts();
      fetchLeaderboard(); // Always fetch leaderboard for all users
      if (userInfo.role === 'admin') {
        fetchAdminStats();
        fetchReportedShoutouts();
      }
    }
  }, [isLoggedIn, userInfo]);

  const validateToken = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUserInfo(userData);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('authToken');
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/departments`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) { 
      console.error('Error fetching departments:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/users`, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) { 
      console.error('Error fetching users:', error);
    }
  };

  const fetchShoutouts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/shoutouts`, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setShoutouts(data);
      }
    } catch (error) { 
      console.error('Error fetching shoutouts:', error);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/admin/stats`, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAdminStats(data);
      }
    } catch (error) { 
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/leaderboard`, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (error) { 
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchReportedShoutouts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/reports`, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setReportedShoutouts(data);
      }
    } catch (error) { 
      console.error('Error fetching reported shoutouts:', error);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${API_URL}/api/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setNewShoutout({...newShoutout, image_url: data.image_url});
        setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle adding reactions
  const handleAddReaction = async (shoutoutId, reactionType) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/shoutouts/${shoutoutId}/reactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reaction_type: reactionType })
      });
      
      if (res.ok) {
        fetchShoutouts();
        fetchLeaderboard(); // Refresh leaderboard after reaction
        setMessage({ type: 'success', text: `Added ${reactionType} reaction!` });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      setMessage({ type: 'error', text: 'Failed to add reaction' });
    }
  };

  // Handle report shoutout
  const handleReportShoutout = async (shoutoutId) => {
    if (!reportReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for reporting' });
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          shoutout_id: shoutoutId,
          reason: reportReason,
          description: reportReason
        })
      });
      
      if (res.ok) {
        setReportReason('');
        setReportingShoutout(null);
        setMessage({ type: 'success', text: 'Shoutout reported successfully!' });
        if (userInfo.role === 'admin') {
          fetchReportedShoutouts();
        }
      }
    } catch (error) {
      console.error('Error reporting shoutout:', error);
      setMessage({ type: 'error', text: 'Failed to report shoutout' });
    }
  };

  // Handle resolve report
  const handleResolveReport = async (reportId, action) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      
      if (res.ok) {
        fetchReportedShoutouts();
        fetchShoutouts();
        setMessage({ type: 'success', text: `Report ${action === 'dismiss' ? 'dismissed' : 'shoutout removed'}!` });
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      setMessage({ type: 'error', text: 'Failed to resolve report' });
    }
  };

  // Handle delete shoutout (admin only)
  const handleDeleteShoutout = async (shoutoutId) => {
    if (!window.confirm('Are you sure you want to delete this shoutout? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/shoutouts/${shoutoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        fetchShoutouts();
        fetchLeaderboard();
        if (userInfo.role === 'admin') {
          fetchReportedShoutouts();
          fetchAdminStats();
        }
        setMessage({ type: 'success', text: 'Shoutout deleted successfully!' });
      }
    } catch (error) {
      console.error('Error deleting shoutout:', error);
      setMessage({ type: 'error', text: 'Failed to delete shoutout' });
    }
  };

  // Handle comments
  const handleAddComment = async (shoutoutId, text, parentId = null) => {
    if (!text.trim()) return;
    
    setCommentLoading({...commentLoading, [shoutoutId]: true});
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/shoutouts/${shoutoutId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, parent_id: parentId })
      });
      
      if (res.ok) {
        const newCommentData = await res.json();
        setComments(prev => {
          const shoutoutComments = prev[shoutoutId] || [];
          if (parentId) {
            const updatedComments = shoutoutComments.map(comment => 
              comment.id === parentId 
                ? { ...comment, replies: [...(comment.replies || []), newCommentData] }
                : comment
            );
            return { ...prev, [shoutoutId]: updatedComments };
          } else {
            return { ...prev, [shoutoutId]: [...shoutoutComments, newCommentData] };
          }
        });
        setNewComment('');
        setReplyToCommentId(null);
        setMessage({ type: 'success', text: 'Comment added!' });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setMessage({ type: 'error', text: 'Failed to add comment' });
    } finally {
      setCommentLoading({...commentLoading, [shoutoutId]: false});
    }
  };

  const handleEditComment = async (shoutoutId, commentId, newText) => {
    if (!newText.trim()) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newText })
      });
      
      if (res.ok) {
        setComments(prev => {
          const shoutoutComments = prev[shoutoutId] || [];
          const updatedComments = shoutoutComments.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, text: newText, is_edited: true };
            }
            if (comment.replies) {
              const updatedReplies = comment.replies.map(reply =>
                reply.id === commentId ? { ...reply, text: newText, is_edited: true } : reply
              );
              return { ...comment, replies: updatedReplies };
            }
            return comment;
          });
          return { ...prev, [shoutoutId]: updatedComments };
        });
        setEditingCommentId(null);
        setMessage({ type: 'success', text: 'Comment updated!' });
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      setMessage({ type: 'error', text: 'Failed to update comment' });
    }
  };

  const handleDeleteComment = async (shoutoutId, commentId, isReply = false, parentId = null) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        setComments(prev => {
          const shoutoutComments = prev[shoutoutId] || [];
          if (isReply && parentId) {
            const updatedComments = shoutoutComments.map(comment => 
              comment.id === parentId 
                ? { ...comment, replies: comment.replies.filter(reply => reply.id !== commentId) }
                : comment
            );
            return { ...prev, [shoutoutId]: updatedComments };
          } else {
            return { ...prev, [shoutoutId]: shoutoutComments.filter(comment => comment.id !== commentId) };
          }
        });
        setMessage({ type: 'success', text: 'Comment deleted!' });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setMessage({ type: 'error', text: 'Failed to delete comment' });
    }
  };

  const canModerateComment = (commentUserId, commentUserRole) => {
    const userRole = userInfo?.role;
    const userId = userInfo?.id;
    
    return userRole === 'admin' || 
           userRole === 'manager' || 
           userId === commentUserId;
  };

  // Export functions
  const exportToCSV = async (type) => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      let endpoint;
      let filename;
      
      switch(type) {
        case 'shoutouts':
          endpoint = '/api/export/shoutouts/csv';
          filename = `shoutouts_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'users':
          endpoint = '/api/export/users/csv';
          filename = `users_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'leaderboard':
          endpoint = '/api/export/leaderboard/csv';
          filename = `leaderboard_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          return;
      }
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Create and download CSV
        const blob = new Blob([data.content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: `${type} CSV exported successfully!` });
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setMessage({ type: 'error', text: 'Failed to export CSV' });
    } finally {
      setExportLoading(false);
    }
  };

  // PDF Export functions
  const exportToPDF = async (type) => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      let endpoint;
      let filename;
      
      switch(type) {
        case 'shoutouts':
          endpoint = '/api/export/shoutouts/pdf';
          filename = `shoutouts_report_${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'leaderboard':
          endpoint = '/api/export/leaderboard/pdf';
          filename = `leaderboard_${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'reports':
          endpoint = '/api/export/reports/pdf';
          filename = `reports_analysis_${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        default:
          return;
      }
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: `${type} PDF exported successfully!` });
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setMessage({ type: 'error', text: 'Failed to export PDF' });
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalUsers = users.length;
    const deptUsers = users.filter(u => u.department_id === userInfo?.department_id).length;
    
    const sentShoutouts = shoutouts.filter(s => s.sender_id === userInfo?.id).length;
    const receivedShoutouts = shoutouts.filter(s => 
      s.recipients?.some(r => r.id === userInfo?.id)
    ).length;
    
    const totalReactions = shoutouts.reduce((total, shoutout) => {
      if (shoutout.reaction_counts) {
        return total + Object.values(shoutout.reaction_counts).reduce((a, b) => a + b, 0);
      }
      return total;
    }, 0);
    
    const userReactionsGiven = shoutouts.reduce((total, shoutout) => {
      if (shoutout.user_reactions) {
        return total + shoutout.user_reactions.filter(r => r.user_id === userInfo?.id).length;
      }
      return total;
    }, 0);
    
    return {
      totalUsers,
      deptUsers,
      sentShoutouts,
      receivedShoutouts,
      totalReactions,
      userReactionsGiven
    };
  };

  // Admin-specific navigation items
  const adminNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'text-blue-500', bgColor: 'bg-blue-500' },
    { id: 'shoutouts', label: 'Shoutouts', icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-500' },
    { id: 'users', label: 'All Users', icon: Users, color: 'text-green-500', bgColor: 'bg-green-500' },
    { id: 'mydepartment', label: 'My Department', icon: Building2, color: 'text-orange-500', bgColor: 'bg-orange-500' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, color: 'text-indigo-500', bgColor: 'bg-indigo-500' },
    { id: 'admin', label: 'Admin Dashboard', icon: Shield, color: 'text-red-500', bgColor: 'bg-red-500' },
    { id: 'moderation', label: 'Moderation', icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
    { id: 'reports', label: 'Reports', icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-500' },
  ];

  // Regular user navigation items
  const userNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'text-blue-500', bgColor: 'bg-blue-500' },
    { id: 'shoutouts', label: 'Shoutouts', icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-500' },
    { id: 'users', label: 'All Users', icon: Users, color: 'text-green-500', bgColor: 'bg-green-500' },
    { id: 'mydepartment', label: 'My Department', icon: Building2, color: 'text-orange-500', bgColor: 'bg-orange-500' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, color: 'text-indigo-500', bgColor: 'bg-indigo-500' },
  ];

  // Comment Component
  const CommentItem = ({ comment, shoutoutId, isReply = false, parentId = null }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    
    const canModerate = canModerateComment(comment.user_id, comment.user_role);
    const isOwnComment = comment.user_id === userInfo?.id;
    
    const handleSaveEdit = () => {
      handleEditComment(shoutoutId, comment.id, editText);
      setIsEditing(false);
    };
    
    const handleSubmitReply = () => {
      if (replyText.trim()) {
        handleAddComment(shoutoutId, replyText, parentId || comment.id);
        setReplyText('');
        setShowReplyForm(false);
      }
    };
    
    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`${isReply ? 'ml-8 mt-3' : 'mt-4'} border-l-2 border-gray-200 pl-4`}
      >
        <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {comment.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{comment.username}</span>
                  {comment.user_role === 'admin' && (
                    <Crown className="w-3 h-3 text-yellow-600" />
                  )}
                  {comment.user_role === 'manager' && (
                    <Shield className="w-3 h-3 text-blue-600" />
                  )}
                  {isOwnComment && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">You</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(comment.created_at)}</span>
                  {comment.is_edited && (
                    <span className="text-gray-400">• edited</span>
                  )}
                </div>
              </div>
            </div>
            
            {canModerate && (
              <div className="relative group">
                <button className="p-1 hover:bg-gray-200 rounded">
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg py-1 z-10 hidden group-hover:block min-w-[120px]">
                  {isOwnComment && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 w-full text-left"
                    >
                      <Edit className="w-3 h-3" />
                      <span className="text-sm">Edit</span>
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteComment(shoutoutId, comment.id, isReply, parentId)}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 w-full text-left text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="text-sm">Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 text-sm mt-2">{comment.text}</p>
          )}
          
          <div className="flex gap-3 mt-2">
            <button 
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
            {comment.replies && comment.replies.length > 0 && (
              <button className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1">
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
          
          {showReplyForm && (
            <div className="mt-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={handleSubmitReply}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                >
                  Post Reply
                </button>
                <button 
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map(reply => (
              <CommentItem 
                key={reply.id}
                comment={reply}
                shoutoutId={shoutoutId}
                isReply={true}
                parentId={comment.id}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  // Admin Dashboard Component
  const AdminDashboard = () => {
    return (
      <div className="space-y-6">
        {/* Admin Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-100 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Total Users</p>
                <h3 className="text-3xl font-bold mt-2 text-red-700">{adminStats?.total_users || 0}</h3>
                <p className="text-xs text-red-500 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {adminStats?.user_growth || 0}% growth
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Active Users</p>
                <h3 className="text-3xl font-bold mt-2 text-blue-700">{adminStats?.active_users || 0}</h3>
                <p className="text-xs text-blue-500 mt-1">
                  <Activity className="w-3 h-3 inline mr-1" />
                  Last 7 days
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Avg. Reactions</p>
                <h3 className="text-3xl font-bold mt-2 text-purple-700">{adminStats?.avg_reactions || 0}</h3>
                <p className="text-xs text-purple-500 mt-1">
                  <BarChart3 className="w-3 h-3 inline mr-1" />
                  Per shoutout
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <ThumbsUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Reports</p>
                <h3 className="text-3xl font-bold mt-2 text-orange-700">{adminStats?.pending_reports || 0}</h3>
                <p className="text-xs text-orange-500 mt-1">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Pending resolution
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <Flag className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top Contributors & Most Tagged */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Contributors */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Top Contributors
              </h3>
              <button 
                onClick={fetchAdminStats}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {adminStats?.top_contributors?.slice(0, 5).map((user, index) => (
                <motion.div 
                  key={user.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-amber-700' : 'text-gray-500'
                      }`}>
                        #{index + 1}
                      </span>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.department || 'No Dept'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">{user.total_shoutouts}</div>
                    <div className="text-xs text-gray-500">shoutouts</div>
                  </div>
                </motion.div>
              ))}
              
              {(!adminStats?.top_contributors || adminStats.top_contributors.length === 0) && (
                <div className="text-center py-6 text-gray-500">
                  <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No contributor data yet</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Most Tagged Users */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                Most Tagged Users
              </h3>
              <span className="text-sm text-gray-500">This month</span>
            </div>
            
            <div className="space-y-4">
              {adminStats?.most_tagged_users?.slice(0, 5).map((user, index) => (
                <motion.div 
                  key={user.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.times_tagged} tags</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{user.times_tagged}</div>
                    <div className="text-xs text-gray-500">mentions</div>
                  </div>
                </motion.div>
              ))}
              
              {(!adminStats?.most_tagged_users || adminStats.most_tagged_users.length === 0) && (
                <div className="text-center py-6 text-gray-500">
                  <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No tags yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Export Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <DownloadCloud className="w-5 h-5 text-blue-600" />
                Export Reports
              </h3>
              <p className="text-sm text-gray-600 mt-1">Download platform data and analytics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => exportToCSV('shoutouts')}
              disabled={exportLoading}
              className="flex flex-col items-center justify-center p-6 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
            >
              <FileSpreadsheet className="w-10 h-10 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-green-700">Export Shoutouts CSV</span>
              <span className="text-sm text-gray-600 mt-1">All shoutouts data</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => exportToPDF('shoutouts')}
              disabled={exportLoading}
              className="flex flex-col items-center justify-center p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <FileText className="w-10 h-10 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-blue-700">Export Shoutouts PDF</span>
              <span className="text-sm text-gray-600 mt-1">Formatted PDF report</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => exportToPDF('leaderboard')}
              disabled={exportLoading}
              className="flex flex-col items-center justify-center p-6 border-2 border-yellow-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all group"
            >
              <FileText className="w-10 h-10 text-yellow-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-yellow-700">Export Leaderboard PDF</span>
              <span className="text-sm text-gray-600 mt-1">Leaderboard with charts</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => exportToCSV('users')}
              disabled={exportLoading}
              className="flex flex-col items-center justify-center p-6 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
            >
              <FileSpreadsheet className="w-10 h-10 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-purple-700">Export Users CSV</span>
              <span className="text-sm text-gray-600 mt-1">All users data</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => exportToCSV('leaderboard')}
              disabled={exportLoading}
              className="flex flex-col items-center justify-center p-6 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
            >
              <FileSpreadsheet className="w-10 h-10 text-indigo-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-indigo-700">Export Leaderboard CSV</span>
              <span className="text-sm text-gray-600 mt-1">Leaderboard data</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => exportToPDF('reports')}
              disabled={exportLoading}
              className="flex flex-col items-center justify-center p-6 border-2 border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all group"
            >
              <FileText className="w-10 h-10 text-red-600 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-red-700">Export Reports PDF</span>
              <span className="text-sm text-gray-600 mt-1">Reports analysis</span>
            </motion.button>
          </div>
          
          {exportLoading && (
            <div className="mt-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              <span className="text-gray-600">Generating report...</span>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  // Moderation Panel Component
  const ModerationPanel = () => {
    return (
      <div className="space-y-6">
        {/* Report Shoutout Modal */}
        <AnimatePresence>
          {reportingShoutout && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Report Shoutout
                </h3>
                <p className="text-gray-600 mb-4">
                  Why are you reporting this shoutout by <strong>{reportingShoutout.sender_name}</strong>?
                </p>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Please provide details about why this shoutout is inappropriate..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                  rows={4}
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setReportingShoutout(null);
                      setReportReason('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleReportShoutout(reportingShoutout.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Submit Report
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reported Shoutouts */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-600" />
                Reported Shoutouts ({reportedShoutouts.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">Review and take action on reported content</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchReportedShoutouts}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button 
                onClick={() => exportToPDF('reports')}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          {reportedShoutouts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No reported shoutouts!</p>
              <p className="text-gray-500 text-sm mt-2">All content is clean and appropriate</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportedShoutouts.map((report, index) => (
                <motion.div 
                  key={report.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-red-200 rounded-xl p-4 bg-gradient-to-r from-red-50 to-white"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {report.shoutout_sender_username?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold">{report.shoutout_sender_username}</p>
                          <p className="text-xs text-gray-500">
                            Reported by: {report.reporter_username}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{report.shoutout_message}</p>
                      <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg inline-block">
                        <strong>Reason:</strong> {report.reason}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleResolveReport(report.id, 'dismiss')}
                      className="flex-1 px-4 py-2 bg-green-100 text-green-800 hover:bg-green-200 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Dismiss Report
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleResolveReport(report.id, 'remove')}
                      className="flex-1 px-4 py-2 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <XSquare className="w-4 h-4" />
                      Remove Shoutout
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  // Leaderboard Component
  const LeaderboardView = () => {
    const getRankColor = (index) => {
      switch(index) {
        case 0: return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-200 shadow-lg';
        case 1: return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200 shadow-md';
        case 2: return 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200 shadow-md';
        default: return 'bg-white border-gray-200';
      }
    };

    const getRankIcon = (index) => {
      switch(index) {
        case 0: return <Trophy className="w-6 h-6 text-yellow-600" />;
        case 1: return <Trophy className="w-6 h-6 text-gray-400" />;
        case 2: return <Trophy className="w-6 h-6 text-amber-700" />;
        default: return <span className="text-gray-500 font-bold">#{index + 1}</span>;
      }
    };

    // Find current user's rank
    const currentUserRank = leaderboard.findIndex(user => user.id === userInfo?.id);
    const currentUserData = leaderboard.find(user => user.id === userInfo?.id);

    return (
      <div className="space-y-6">
        {/* Current User Stats */}
        {currentUserData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {userInfo?.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Your Ranking</h3>
                  <p className="text-gray-600">
                    <span className="text-3xl font-bold text-blue-700">
                      #{currentUserRank >= 0 ? currentUserRank + 1 : 'N/A'}
                    </span>
                    <span className="text-sm ml-2">out of {leaderboard.length} users</span>
                  </p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-sm text-gray-600">
                      <Trophy className="w-4 h-4 inline mr-1" />
                      {currentUserData.points} points
                    </span>
                    <span className="text-sm text-gray-600">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      {currentUserData.shoutouts_sent + (currentUserData.shoutouts_received || 0)} shoutouts
                    </span>
                    <span className="text-sm text-gray-600">
                      <ThumbsUp className="w-4 h-4 inline mr-1" />
                      {currentUserData.reactions_received} reactions
                    </span>
                  </div>
                </div>
              </div>
              {userInfo?.role === 'admin' && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => exportToPDF('leaderboard')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <span className="bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                  Leaderboard
                </span>
              </h2>
              <p className="text-gray-600 mt-1">Top contributors based on shoutouts and reactions</p>
            </div>
            <div className="flex gap-2">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchLeaderboard}
                className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
              {userInfo?.role === 'admin' && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => exportToCSV('leaderboard')}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export CSV
                </motion.button>
              )}
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No leaderboard data yet</p>
              <p className="text-gray-500 text-sm mt-2">Shoutouts and reactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((user, index) => (
                <motion.div 
                  key={user.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 5 }}
                  className={`p-4 rounded-xl border ${getRankColor(index)} hover:shadow-md transition-all ${
                    user.id === userInfo?.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10">
                        {getRankIcon(index)}
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {user.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{user.username}</h3>
                          {user.id === userInfo?.id && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {user.shoutouts_sent + (user.shoutouts_received || 0)} shoutouts
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {user.reactions_received || 0} reactions
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {user.department_name || 'No Dept'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-800">{user.points || user.score}</div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                  
                  {index < 3 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Metrics:</span>
                        <div className="flex gap-4">
                          <span className="text-green-600">
                            +{(user.shoutouts_sent || 0) * 2} from sent
                          </span>
                          <span className="text-blue-600">
                            +{(user.shoutouts_received || 0) * 10} from received
                          </span>
                          <span className="text-purple-600">
                            +{(user.reactions_received || 0) * 5} from reactions
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  // Reports Component
  const ReportsView = () => {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-blue-600" />
                Analytics & Reports
              </h2>
              <p className="text-gray-600 mt-1">Comprehensive platform analytics and insights</p>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportToPDF('shoutouts')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </motion.button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-4">Activity Trends</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Shoutouts</span>
                  <span className="font-bold">{adminStats?.total_shoutouts || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Reactions</span>
                  <span className="font-bold">{adminStats?.total_reactions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Reactions</span>
                  <span className="font-bold">{adminStats?.avg_reactions || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
              <h3 className="font-bold text-green-800 mb-4">User Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <span className="font-bold">{adminStats?.total_users || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Departments</span>
                  <span className="font-bold">{adminStats?.total_departments || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Reports</span>
                  <span className="font-bold text-red-600">{adminStats?.pending_reports || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Shoutouts */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-4">Recent Shoutouts</h3>
            <div className="space-y-3">
              {adminStats?.recent_shoutouts?.map((shoutout, index) => (
                <motion.div 
                  key={shoutout.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{shoutout.message}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span>By: {shoutout.sender}</span>
                        <span>•</span>
                        <span>{new Date(shoutout.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {(!adminStats?.recent_shoutouts || adminStats.recent_shoutouts.length === 0) && (
                <div className="text-center py-6 text-gray-500">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No recent shoutouts</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      return setMessage({ type: 'error', text: 'Please fill all required fields' });
    }
    if (!isLogin && !formData.username) {
      return setMessage({ type: 'error', text: 'Please enter a username' });
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            department_id: formData.department_id ? parseInt(formData.department_id) : null
          };
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        throw new Error(data.detail || `Request failed with status ${response.status}`);
      }
      
      if (isLogin) {
        if (!data.access_token) {
          throw new Error('No access token received');
        }
        
        localStorage.setItem('authToken', data.access_token);
        
        const userRes = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!userRes.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const userData = await userRes.json();
        setUserInfo(userData);
        setMessage({ type: 'success', text: 'Logged in successfully!' });
        
        setFormData({ email: '', password: '', username: '', role: 'employee', department_id: '' });
        
        setTimeout(() => {
          setIsLoggedIn(true);
        }, 500);
        
      } else {
        setMessage({ type: 'success', text: 'Registration successful! You can now login.' });
        
        setTimeout(() => { 
          setIsLogin(true); 
          setFormData({ email: formData.email, password: '', username: '', role: 'employee', department_id: '' });
        }, 1500);
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      setMessage({
        type: 'error', 
        text: error.message || 'Authentication failed. Please check your credentials and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUserInfo(null);
    setUsers([]);
    setShoutouts([]);
    setLeaderboard([]);
    setMessage({ type: 'success', text: 'Logged out successfully' });
  };

  const handleCreateShoutout = async () => {
    if (!newShoutout.message.trim()) {
      setMessage({ type: 'error', text: 'Please enter a message' });
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/shoutouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newShoutout)
      });
      
      if (res.ok) {
        setNewShoutout({ message: '', recipient_ids: [], image_url: '' });
        setSelectedImage(null);
        setImagePreview(null);
        fetchShoutouts();
        fetchLeaderboard(); // Refresh leaderboard after new shoutout
        if (userInfo.role === 'admin') {
          fetchAdminStats();
        }
        setMessage({ type: 'success', text: 'Shoutout posted!' });
      }
    } catch (error) {
      console.error('Error creating shoutout:', error);
      setMessage({ type: 'error', text: 'Failed to post shoutout' });
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload image
      handleImageUpload(file);
    }
  };

  // Reaction icons and colors
  const reactionTypes = [
    { type: 'like', icon: ThumbsUp, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100', label: 'Like' },
    { type: 'clap', icon: Sparkles, color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100', label: 'Clap' },
    { type: 'star', icon: Star, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100', label: 'Star' }
  ];

  // Calculate statistics
  const stats = calculateStats();

  // Filter shoutouts based on filters
  const filteredShoutouts = shoutouts.filter(shoutout => {
    if (filters.department_id && shoutout.recipients) {
      const recipientInDept = shoutout.recipients.some(r => 
        users.find(u => u.id === r.id)?.department_id === parseInt(filters.department_id)
      );
      if (!recipientInDept) return false;
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const messageMatch = shoutout.message.toLowerCase().includes(searchLower);
      const senderMatch = shoutout.sender_name.toLowerCase().includes(searchLower);
      const recipientMatch = shoutout.recipients?.some(r => 
        r.username.toLowerCase().includes(searchLower)
      );
      
      if (!messageMatch && !senderMatch && !recipientMatch) return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (filters.sortBy === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at);
    } else if (filters.sortBy === 'most_reactions') {
      const aReactions = a.reaction_counts ? Object.values(a.reaction_counts).reduce((sum, val) => sum + val, 0) : 0;
      const bReactions = b.reaction_counts ? Object.values(b.reaction_counts).reduce((sum, val) => sum + val, 0) : 0;
      return bReactions - aReactions;
    }
    return 0;
  });

  // Get department users
  const departmentUsers = users.filter(u => u.department_id === userInfo?.department_id);

  // Navigation items based on role
  const navItems = userInfo?.role === 'admin' ? adminNavItems : userNavItems;

  // Login/Register Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            {/* Logo/Header */}
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-white to-purple-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-7 h-7 text-purple-600" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  BragBoard
                </h1>
              </div>
              <p className="text-white/80">
                {isLogin 
                  ? 'Welcome back! Share your achievements and celebrate others.' 
                  : 'Join our community and start celebrating wins together!'}
              </p>
            </motion.div>

            {/* Toggle between Login/Register */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <div className="bg-white/10 rounded-xl p-1 flex mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    isLogin 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    !isLogin 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>
            </motion.div>

            {/* Message Display */}
            {message.text && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                  message.type === 'success' 
                    ? 'bg-green-500/20 text-green-100 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-100 border border-red-500/30'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>{message.text}</span>
              </motion.div>
            )}

            {/* Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="space-y-4">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <label className="block text-white/80 text-sm font-medium mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-white/50" />
                      </div>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                        placeholder="Enter your username"
                      />
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-white/50" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-white/50" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-white/50 hover:text-white" />
                      ) : (
                        <Eye className="w-5 h-5 text-white/50 hover:text-white" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-1">
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                      >
                        <option value="employee" className="bg-gray-800">Employee</option>
                        <option value="manager" className="bg-gray-800">Manager</option>
                        <option value="admin" className="bg-gray-800">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-1">
                        Department
                      </label>
                      <select
                        value={formData.department_id}
                        onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                      >
                        <option value="" className="bg-gray-800">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id} className="bg-gray-800">
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isLogin ? 'Logging in...' : 'Registering...'}
                    </>
                  ) : (
                    isLogin ? 'Login' : 'Create Account'
                  )}
                </motion.button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-white/70">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setMessage({ type: '', text: '' });
                    }}
                    className="text-white font-semibold hover:underline"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Dashboard (Logged In)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <motion.div
                  animate={{ rotate: sidebarOpen ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </motion.div>
              </button>
              
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-white font-bold text-lg">
                    {userInfo?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">BragBoard</h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    Welcome, <span className="font-semibold">{userInfo?.username}</span>!
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
                      userInfo?.role === 'admin' 
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white' :
                      userInfo?.role === 'manager'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white' :
                        'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    }`}>
                      {userInfo?.role}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all shadow-md"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside 
              initial="closed"
              animate="open"
              exit="closed"
              variants={sidebarVariants}
              className="w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-xl min-h-[calc(100vh-80px)]"
            >
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5" />
                  Navigation
                </h2>
                
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <motion.button
                      key={item.id}
                      whileHover={{ x: 10, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        activeTab === item.id 
                          ? `${item.bgColor} text-white shadow-lg` 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-white bg-opacity-20' : item.bgColor} bg-opacity-10`}>
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : item.color}`} />
                      </div>
                      <span className="font-medium">{item.label}</span>
                      {activeTab === item.id && (
                        <motion.div 
                          layoutId="activeTab"
                          className="ml-auto w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </motion.button>
                  ))}
                </nav>
                
                {/* Stats Summary */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">Quick Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Users</span>
                      <span className="font-bold text-blue-600">{stats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Shoutouts</span>
                      <span className="font-bold text-purple-600">{stats.sentShoutouts + stats.receivedShoutouts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Reactions</span>
                      <span className="font-bold text-green-600">{stats.totalReactions}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="h-full"
            >
              {message.text && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className={`mb-6 p-4 rounded-xl flex gap-3 ${
                    message.type === 'success' 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-lg' 
                      : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 shadow-lg'
                  }`}
                >
                  {message.type === 'success' 
                    ? <CheckCircle className="w-5 h-5 text-green-600" /> 
                    : <AlertCircle className="w-5 h-5 text-red-600" />
                  }
                  <span className={message.type === 'success' ? 'text-green-800 font-medium' : 'text-red-800 font-medium'}>
                    {message.text}
                  </span>
                </motion.div>
              )}

              {/* Create Shoutout Form - Show on Shoutouts tab */}
              {activeTab === 'shoutouts' && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-8"
                >
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Send className="w-6 h-6 text-purple-600" />
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Create a Shoutout
                      </span>
                    </h2>
                    <textarea
                      value={newShoutout.message}
                      onChange={(e) => setNewShoutout({...newShoutout, message: e.target.value})}
                      placeholder="Share your appreciation for a colleague..."
                      className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                      rows={4}
                    />
                    
                    {/* Image Upload */}
                    <div className="mt-4">
                      <div className="flex items-center gap-4">
                        <motion.label 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all bg-gradient-to-r from-gray-50 to-white">
                            <ImageIcon className="w-4 h-4 text-gray-600" />
                            <span className="font-medium">Add Image</span>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </motion.label>
                        
                        {uploadingImage && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading...</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Image Preview */}
                      {(imagePreview || newShoutout.image_url) && (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="mt-3"
                        >
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden border shadow-lg group">
                            <img 
                              src={imagePreview || `${API_URL}${newShoutout.image_url}`} 
                              alt="Preview" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <button 
                              onClick={() => {
                                setSelectedImage(null);
                                setImagePreview(null);
                                setNewShoutout({...newShoutout, image_url: ''});
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all hover:scale-110"
                            >
                              <span className="text-xs">×</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mt-4">
                      <select 
                        value={newShoutout.recipient_ids[0] || ''}
                        onChange={(e) => setNewShoutout({...newShoutout, recipient_ids: e.target.value ? [parseInt(e.target.value)] : []})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="">Select recipient (optional)</option>
                        {users.filter(u => u.id !== userInfo?.id).map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username} - {user.department_name || 'No Dept'}
                          </option>
                        ))}
                      </select>
                      
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateShoutout}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all flex items-center gap-2 shadow-md"
                      >
                        <Send className="w-4 h-4" />
                        Post Shoutout
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Dashboard Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500', delay: 0.1 },
                      { label: 'Dept Users', value: stats.deptUsers, icon: Building2, color: 'from-purple-500 to-pink-500', delay: 0.2 },
                      { label: 'Shoutouts Sent', value: stats.sentShoutouts, icon: Send, color: 'from-green-500 to-emerald-500', delay: 0.3 },
                      { label: 'Shoutouts Received', value: stats.receivedShoutouts, icon: MessageSquare, color: 'from-yellow-500 to-orange-500', delay: 0.4 },
                      { label: 'Total Reactions', value: stats.totalReactions, icon: Heart, color: 'from-red-500 to-rose-500', delay: 0.5 },
                      { label: 'Your Reactions', value: stats.userReactionsGiven, icon: ThumbsUp, color: 'from-indigo-500 to-blue-500', delay: 0.6 },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: stat.delay, type: "spring" }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">{stat.label}</p>
                            <h3 className="text-3xl font-bold mt-2 bg-gradient-to-r bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                              {stat.value}
                            </h3>
                          </div>
                          <div className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                            <stat.icon className="w-7 h-7 text-white" />
                          </div>
                        </div>
                        <motion.div 
                          className="h-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full mt-4 overflow-hidden"
                        >
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: stat.delay + 0.2, duration: 1 }}
                            className={`h-full bg-gradient-to-r ${stat.color}`}
                          />
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Recent Shoutouts Preview */}
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Recent Shoutouts
                        </span>
                      </h2>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('shoutouts')}
                        className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 group"
                      >
                        View All
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                    
                    <div className="space-y-4">
                      {shoutouts.slice(0, 3).map((shoutout, index) => (
                        <motion.div 
                          key={shoutout.id}
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          whileHover={{ x: 5 }}
                          className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50"
                        >
                          <div className="flex justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                                <span className="text-white font-semibold">
                                  {shoutout.sender_name?.[0]?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{shoutout.sender_name}</p>
                                <p className="text-sm text-gray-500">{formatDate(shoutout.created_at)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {shoutout.image_url && (
                                <div className="w-12 h-12 rounded-lg overflow-hidden border shadow-sm group">
                                  <img 
                                    src={`${API_URL}${shoutout.image_url}`} 
                                    alt="Shoutout" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="mt-3 text-gray-700 line-clamp-2">{shoutout.message}</p>
                          <div className="flex gap-2 mt-3">
                            <button 
                              onClick={() => setReportingShoutout(shoutout)}
                              className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                            >
                              <Flag className="w-3 h-3" />
                              Report
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      
                      {shoutouts.length === 0 && (
                        <div className="text-center py-8">
                          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No shoutouts yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}

              {activeTab === 'shoutouts' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        All Shoutouts ({filteredShoutouts.length})
                      </span>
                    </h2>
                    
                    <div className="flex gap-3">
                      <motion.div whileHover={{ scale: 1.05 }} className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search shoutouts..."
                          value={filters.search}
                          onChange={(e) => setFilters({...filters, search: e.target.value})}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                      </motion.div>
                      
                      <select 
                        value={filters.department_id}
                        onChange={(e) => setFilters({...filters, department_id: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                      
                      <select 
                        value={filters.sortBy}
                        onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="most_reactions">Most Reactions</option>
                      </select>
                      
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchShoutouts}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        Refresh
                      </motion.button>
                    </div>
                  </div>

                  {filteredShoutouts.length === 0 ? (
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-center py-12"
                    >
                      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No shoutouts found</p>
                      <p className="text-gray-400 mt-2">Try changing your filters or create the first shoutout!</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-6">
                      {filteredShoutouts.map((shoutout, index) => {
                        const userReaction = shoutout.user_reactions?.find(
                          r => r.user_id === userInfo?.id
                        );
                        
                        const shoutoutComments = comments[shoutout.id] || [];
                        
                        return (
                          <motion.div
                            key={shoutout.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -2 }}
                            className="border border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50 relative"
                          >
                            {/* Report button for non-admin users */}
                            {userInfo?.role !== 'admin' && shoutout.sender_id !== userInfo?.id && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setReportingShoutout(shoutout)}
                                className="absolute top-4 right-4 p-1.5 hover:bg-red-50 rounded-full transition-colors group"
                                title="Report shoutout"
                              >
                                <Flag className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                              </motion.button>
                            )}
                            
                            {/* Delete button for admin */}
                            {userInfo?.role === 'admin' && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteShoutout(shoutout.id)}
                                className="absolute top-4 right-4 p-1.5 hover:bg-red-50 rounded-full transition-colors group"
                                title="Delete shoutout"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                              </motion.button>
                            )}
                            
                            {/* Shoutout Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                                  <span className="text-white font-bold text-lg">
                                    {shoutout.sender_name?.[0]?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-gray-900 text-lg">{shoutout.sender_name}</p>
                                    {shoutout.sender_id === userInfo?.id && (
                                      <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">You</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDate(shoutout.created_at)}</span>
                                    {shoutout.recipients && shoutout.recipients.length > 0 && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          <Send className="w-3 h-3" />
                                          To: {shoutout.recipients.map(r => r.username).join(', ')}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {shoutout.image_url && (
                                <div className="w-24 h-24 rounded-lg overflow-hidden border shadow-lg group">
                                  <img 
                                    src={`${API_URL}${shoutout.image_url}`} 
                                    alt="Shoutout" 
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                    onClick={() => window.open(`${API_URL}${shoutout.image_url}`, '_blank')}
                                  />
                                </div>
                              )}
                            </div>
                            
                            {/* Shoutout Message */}
                            <div className="mb-6">
                              <p className="text-gray-800 text-lg whitespace-pre-wrap">{shoutout.message}</p>
                            </div>
                            
                            {/* Reaction Bar */}
                            <div className="flex justify-between items-center border-t border-b border-gray-100 py-3 mb-4">
                              <div className="flex items-center gap-4">
                                {reactionTypes.map(({ type, icon: Icon, color }) => {
                                  const count = shoutout.reaction_counts?.[type] || 0;
                                  const isActive = userReaction?.reaction_type === type;
                                  
                                  return (
                                    <motion.button
                                      key={type}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleAddReaction(shoutout.id, type)}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                                        isActive 
                                          ? `${color.split(' ')[0]} ${color.split(' ')[2]} border ${color.split(' ')[0].replace('text', 'border')}-200 shadow-md`
                                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                      }`}
                                    >
                                      <Icon className={`w-4 h-4 ${isActive ? color.split(' ')[0] : ''}`} />
                                      <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                                        {count > 0 ? count : ''}
                                      </span>
                                    </motion.button>
                                  );
                                })}
                              </div>
                              
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                onClick={() => {
                                  // Toggle comments visibility
                                  if (comments[shoutout.id]) {
                                    setComments(prev => {
                                      const newComments = {...prev};
                                      delete newComments[shoutout.id];
                                      return newComments;
                                    });
                                  } else {
                                    // Load comments for this shoutout
                                    fetch(`${API_URL}/api/shoutouts/${shoutout.id}/comments`, {
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                      }
                                    })
                                      .then(res => res.json())
                                      .then(data => {
                                        setComments(prev => ({ ...prev, [shoutout.id]: data }));
                                      })
                                      .catch(console.error);
                                  }
                                }}
                                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-all"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>{comments[shoutout.id] ? 'Hide Comments' : 'Show Comments'}</span>
                                <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                                  {shoutoutComments.length}
                                </span>
                              </motion.button>
                            </div>
                            
                            {/* Comments Section */}
                            {comments[shoutout.id] && (
                              <div className="mt-6">
                                <div className="mb-4">
                                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    Comments ({shoutoutComments.length})
                                  </h4>
                                  
                                  {/* Add Comment Form */}
                                  <div className="mb-6">
                                    <div className="flex gap-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold">
                                          {userInfo?.username?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <textarea
                                          value={newComment}
                                          onChange={(e) => setNewComment(e.target.value)}
                                          placeholder="Add a comment..."
                                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                          rows={2}
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                          <div className="flex gap-2">
                                            <button className="p-1 hover:bg-gray-100 rounded">
                                              <Smile className="w-4 h-4 text-gray-500" />
                                            </button>
                                          </div>
                                          <div className="flex gap-2">
                                            {replyToCommentId && (
                                              <button 
                                                onClick={() => setReplyToCommentId(null)}
                                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                              >
                                                Cancel Reply
                                              </button>
                                            )}
                                            <motion.button
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              onClick={() => handleAddComment(shoutout.id, newComment)}
                                              disabled={!newComment.trim() || commentLoading[shoutout.id]}
                                              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              {commentLoading[shoutout.id] ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                'Post Comment'
                                              )}
                                            </motion.button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Comments List */}
                                  <div className="space-y-2">
                                    {shoutoutComments.length === 0 ? (
                                      <div className="text-center py-6 text-gray-500">
                                        No comments yet. Be the first to comment!
                                      </div>
                                    ) : (
                                      shoutoutComments.map(comment => (
                                        <CommentItem 
                                          key={comment.id}
                                          comment={comment}
                                          shoutoutId={shoutout.id}
                                        />
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          All Users ({users.length})
                        </span>
                      </h2>
                      <p className="text-gray-600 mt-1">View and manage all platform users</p>
                    </div>
                    <div className="flex gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchUsers}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-xl transition-all shadow-md flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Refresh Users
                      </motion.button>
                      {userInfo?.role === 'admin' && (
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => exportToCSV('users')}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-xl transition-all shadow-md flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export CSV
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {users.length === 0 ? (
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-center py-12"
                    >
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No users found</p>
                      <p className="text-gray-400 mt-2">Users will appear here once they register</p>
                    </motion.div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {users.map((user, index) => (
                            <motion.tr 
                              key={user.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                                    <span className="text-white font-semibold">
                                      {user.username?.[0]?.toUpperCase() || '?'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{user.username}</p>
                                    {user.id === userInfo?.id && (
                                      <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">You</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700">{user.email}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  user.role === 'admin' ? 'bg-red-100 text-red-800 border border-red-200' :
                                  user.role === 'manager' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                  'bg-green-100 text-green-800 border border-green-200'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                  <span>{user.department_name || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setActiveTab('shoutouts');
                                      setNewShoutout({
                                        ...newShoutout,
                                        recipient_ids: [user.id]
                                      });
                                    }}
                                    className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                  >
                                    Shoutout
                                  </motion.button>
                                  {userInfo?.role === 'admin' && user.id !== userInfo?.id && (
                                    <motion.button 
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                      onClick={async () => {
                                        if (window.confirm(`Are you sure you want to delete ${user.username}?`)) {
                                          try {
                                            const token = localStorage.getItem('authToken');
                                            const res = await fetch(`${API_URL}/api/users/${user.id}`, {
                                              method: 'DELETE',
                                              headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                              }
                                            });
                                            
                                            if (res.ok) {
                                              fetchUsers();
                                              fetchLeaderboard();
                                              setMessage({ type: 'success', text: 'User deleted successfully!' });
                                            }
                                          } catch (error) {
                                            console.error('Error deleting user:', error);
                                            setMessage({ type: 'error', text: 'Failed to delete user' });
                                          }
                                        }
                                      }}
                                    >
                                      Delete
                                    </motion.button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'mydepartment' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">
                        <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                          My Department
                        </span>
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {userInfo?.department_name || 'No Department Assigned'} 
                        <span className="text-gray-400 ml-2">({departmentUsers.length} members)</span>
                      </p>
                    </div>
                    
                    {!userInfo?.department_name && (
                      <div className="px-4 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">You are not assigned to any department</p>
                      </div>
                    )}
                  </div>

                  {userInfo?.department_name ? (
                    departmentUsers.length === 0 ? (
                      <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-center py-12"
                      >
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No users in your department</p>
                        <p className="text-gray-400 mt-2">Users from your department will appear here</p>
                      </motion.div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departmentUsers.map((user, index) => {
                          const userShoutouts = shoutouts.filter(s => s.sender_id === user.id);
                          const userReceivedShoutouts = shoutouts.filter(s => 
                            s.recipients?.some(r => r.id === user.id)
                          );
                          
                          return (
                            <motion.div
                              key={user.id}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.1, type: "spring" }}
                              whileHover={{ y: -5, scale: 1.02 }}
                              className="border border-gray-200 rounded-2xl p-6 hover:border-orange-300 hover:shadow-xl transition-all bg-gradient-to-br from-white to-gray-50"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                                  <span className="text-white font-bold text-xl">
                                    {user.username?.[0]?.toUpperCase() || '?'}
                                  </span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-gray-900">{user.username}</h3>
                                    {user.id === userInfo?.id && (
                                      <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full">You</span>
                                    )}
                                  </div>
                                  <p className="text-gray-600 text-sm">{user.email}</p>
                                  <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                    user.role === 'admin' ? 'bg-red-100 text-red-800 border border-red-200' :
                                    user.role === 'manager' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                    'bg-green-100 text-green-800 border border-green-200'
                                  }`}>
                                    {user.role}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">{userShoutouts.length}</div>
                                    <div className="text-xs text-gray-600">Shoutouts Given</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{userReceivedShoutouts.length}</div>
                                    <div className="text-xs text-gray-600">Shoutouts Received</div>
                                  </div>
                                </div>
                                
                                <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setActiveTab('shoutouts');
                                    setNewShoutout({
                                      ...newShoutout,
                                      recipient_ids: [user.id]
                                    });
                                  }}
                                  className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all"
                                >
                                  Give Shoutout
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-center py-12"
                    >
                      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No department assigned</p>
                      <p className="text-gray-400 mt-2">Contact an administrator to get assigned to a department</p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Admin Dashboard */}
              {activeTab === 'admin' && userInfo?.role === 'admin' && <AdminDashboard />}
              {activeTab === 'moderation' && userInfo?.role === 'admin' && <ModerationPanel />}
              {activeTab === 'leaderboard' && <LeaderboardView />}
              {activeTab === 'reports' && userInfo?.role === 'admin' && <ReportsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 shadow-lg">
        <div className="flex justify-around">
          {navItems.slice(0, 5).map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center p-2 ${activeTab === item.id ? item.color : 'text-gray-600'}`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label.split(' ')[0]}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BragBoardApp;