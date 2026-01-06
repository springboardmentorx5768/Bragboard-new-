/* eslint-disable no-unused-vars */
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import { motion } from "framer-motion";
import api from "../api";
import "./Dashboard.css";

export default function Dashboard() {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [departmentStats, setDepartmentStats] = useState(null);
  const [departmentMembers, setDepartmentMembers] = useState([]);
  const [departmentActivity, setDepartmentActivity] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [bragsCount, setBragsCount] = useState(0);
  const [totalReactions, setTotalReactions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    department: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [showBragForm, setShowBragForm] = useState(false);
  const [bragContent, setBragContent] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [bragLoading, setBragLoading] = useState(false);
  const [bragError, setBragError] = useState("");
  const [userBrags, setUserBrags] = useState([]);
  const [feedBrags, setFeedBrags] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedFilters, setFeedFilters] = useState({
    department: '',
    sender: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch user data
        const userResponse = await api.get("/users/me");
        setUser(userResponse.data);

        // Fetch department stats
        try {
          const statsResponse = await api.get("/users/department/stats");
          setDepartmentStats(statsResponse.data);
        } catch (err) {
          console.warn("Department stats not available:", err);
        }

        // Fetch department members
        try {
          const membersResponse = await api.get("/users/department/members");
          setDepartmentMembers(membersResponse.data || []);
        } catch (err) {
          console.warn("Department members not available:", err);
        }

        // Fetch department activity
        try {
          const activityResponse = await api.get("/users/department/activity");
          setDepartmentActivity(activityResponse.data || []);
        } catch (err) {
          console.warn("Department activity not available:", err);
        }

        // Fetch all departments
        try {
          const departmentsResponse = await api.get("/users/departments");
          setAllDepartments(departmentsResponse.data || []);
        } catch (err) {
          console.warn("All departments not available:", err);
        }

        // Fetch all users
        try {
          const usersResponse = await api.get("/users/all");
          setAllUsers(usersResponse.data || []);
        } catch (err) {
          console.warn("All users not available:", err);
        }

        // Fetch user brags
        try {
          const bragsResponse = await api.get("/brags/my");
          setUserBrags(bragsResponse.data || []);
          setBragsCount(bragsResponse.data.length);
          // Calculate total reactions on user's brags
          const totalReactionsCount = (bragsResponse.data || []).reduce((sum, brag) => sum + (brag.reactions?.length || 0), 0);
          setTotalReactions(totalReactionsCount);
        } catch (err) {
          console.warn("User brags not available:", err);
        }

        // Fetch feed brags
        try {
          await fetchFeedBrags();
        } catch (err) {
          console.warn("Feed brags not available:", err);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, navigate]);

  // Initialize edit form when user data loads
  useEffect(() => {
    if (user && !isEditingProfile) {
      setEditFormData({
        name: user.name || "",
        email: user.email || "",
        department: user.department || "",
      });
    }
  }, [user, isEditingProfile]);

  const handleEditClick = () => {
    setIsEditingProfile(true);
    setEditError("");
  };

  const handleEditChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setEditLoading(true);
    setEditError("");

    try {
      // Validate form
      if (!editFormData.name.trim()) {
        setEditError("Name cannot be empty");
        setEditLoading(false);
        return;
      }

      if (!editFormData.email.includes("@")) {
        setEditError("Please enter a valid email");
        setEditLoading(false);
        return;
      }

      if (!editFormData.department.trim()) {
        setEditError("Department cannot be empty");
        setEditLoading(false);
        return;
      }

      // Update user profile via API
      const response = await api.put("/users/me", {
        name: editFormData.name,
        email: editFormData.email,
        department: editFormData.department,
      });

      // Update local user state
      setUser(response.data);
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setEditError(
        error.response?.data?.detail ||
          "Failed to save profile. Please try again."
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditError("");
    if (user) {
      setEditFormData({
        name: user.name || "",
        email: user.email || "",
        department: user.department || "",
      });
    }
  };

  const handleCreateBrag = async () => {
    if (!bragContent.trim()) {
      setBragError("Please enter some content for your brag");
      return;
    }
    if (selectedRecipients.length === 0) {
      setBragError("Please select at least one recipient");
      return;
    }

    setBragLoading(true);
    setBragError("");

    try {
      const formData = new FormData();
      formData.append('content', bragContent.trim());
      formData.append('recipient_ids', JSON.stringify(selectedRecipients));
      
      // Add files to form data
      selectedFiles.forEach((file, index) => {
        formData.append('files', file);
      });

      await api.post("/brags", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Reset form
      setBragContent("");
      setSelectedRecipients([]);
      setSelectedFiles([]);
      setShowBragForm(false);

      // Refresh user brags
      const bragsResponse = await api.get("/brags/my");
      setUserBrags(bragsResponse.data);

      // Refresh feed brags with current filters
      await fetchFeedBrags(feedFilters);

      // Update brag count
      setBragsCount(prev => prev + 1);
    } catch (error) {
      console.error("Error creating brag:", error);
      setBragError(
        error.response?.data?.detail ||
          "Failed to create brag. Please try again."
      );
    } finally {
      setBragLoading(false);
    }
  };

  const handleRecipientToggle = (userId) => {
    setSelectedRecipients(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDeleteBrag = async (bragId) => {
    if (!window.confirm('Are you sure you want to delete this brag?')) {
      return;
    }
    try {
      await api.delete(`/brags/${bragId}`);
      // Remove from userBrags
      setUserBrags(prev => prev.filter(brag => brag.id !== bragId));
      // Update count
      setBragsCount(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting brag:', error);
      alert('Failed to delete brag. Please try again.');
    }
  };

  const getUserReaction = (bragId) => {
    const brag = userBrags.find(b => b.id === bragId) || feedBrags.find(b => b.id === bragId);
    if (!brag || !brag.reactions) return null;
    const userReaction = brag.reactions.find(r => r.user.id === user?.id);
    return userReaction ? userReaction.reaction_type : null;
  };

  const getReactionCount = (reactions, type) => {
    if (!reactions) return 0;
    return reactions.filter(r => r.reaction_type === type).length;
  };

  const handleReaction = async (bragId, reactionType) => {
    try {
      const currentReaction = getUserReaction(bragId);
      if (currentReaction === reactionType) {
        // Remove reaction
        await api.delete(`/brags/${bragId}/reactions`);
      } else {
        // Add or update reaction
        await api.post(`/brags/${bragId}/reactions`, { reaction_type: reactionType });
      }
      
      // Refresh the brags
      const bragsResponse = await api.get("/brags/my");
      setUserBrags(bragsResponse.data || []);
      setBragsCount(bragsResponse.data.length);
      
      // Refresh feed if needed
      if (activeTab === 'feed') {
        fetchFeedBrags(feedFilters);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      alert('Failed to update reaction. Please try again.');
    }
  };

  const fetchFeedBrags = async (filters = {}) => {
    setFeedLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.sender) params.append('sender', filters.sender);
      if (filters.dateFrom) {
        // Convert date to ISO format for backend
        const dateFromISO = new Date(filters.dateFrom + 'T00:00:00').toISOString();
        params.append('date_from', dateFromISO);
      }
      if (filters.dateTo) {
        // Convert date to ISO format for backend (end of day)
        const dateToISO = new Date(filters.dateTo + 'T23:59:59').toISOString();
        params.append('date_to', dateToISO);
      }

      const url = `/brags/feed${params.toString() ? '?' + params.toString() : ''}`;
      const response = await api.get(url);
      setFeedBrags(response.data || []);
    } catch (error) {
      console.error('Error fetching feed brags:', error);
      setFeedBrags([]);
    } finally {
      setFeedLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...feedFilters, [field]: value };
    setFeedFilters(newFilters);
    fetchFeedBrags(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      department: '',
      sender: '',
      dateFrom: '',
      dateTo: ''
    };
    setFeedFilters(clearedFilters);
    fetchFeedBrags(clearedFilters);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setBragError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setBragError(`File ${file.name} is not a supported image type.`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setBragError("");
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="spinner"
        />
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR */}
      <motion.aside
        className={`dashboard-sidebar ${sidebarOpen ? "open" : "closed"}`}
        initial={{ x: -250 }}
        animate={{ x: sidebarOpen ? 0 : -250 }}
        transition={{ duration: 0.3 }}
      >
        <div className="sidebar-header">
          <h1 className="sidebar-logo">BragBoard</h1>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
        </div>

        <nav className="sidebar-nav">
          <motion.button
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
            whileHover={{ x: 5 }}
          >
            📊 Overview
          </motion.button>
          <motion.button
            className={`nav-item ${activeTab === "brags" ? "active" : ""}`}
            onClick={() => setActiveTab("brags")}
            whileHover={{ x: 5 }}
          >
            🎯 My Brags
          </motion.button>
          <motion.button
            className={`nav-item ${activeTab === "feed" ? "active" : ""}`}
            onClick={() => setActiveTab("feed")}
            whileHover={{ x: 5 }}
          >
            📰 Feed
          </motion.button>
          <motion.button
            className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
            whileHover={{ x: 5 }}
          >
            👤 Profile
          </motion.button>
        </nav>

        <div className="sidebar-footer">
          <motion.button
            className="logout-btn"
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🚪 Logout
          </motion.button>
        </div>
      </motion.aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {/* TOP HEADER */}
        <header className="dashboard-header">
          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h2>Dashboard</h2>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">{user?.name?.charAt(0) || "U"}</div>
              <span className="user-name">{user?.name || "User"}</span>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="dashboard-content">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <h3 className="section-title mb-8">Welcome, {user?.name}! 👋</h3>

              {/* PERSONAL STATS */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-white mb-4">Your Stats</h4>
                <div className="stats-grid">
                  <motion.div
                    className="stat-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                      <h4>Total Brags</h4>
                      <p className="stat-number">{bragsCount}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="stat-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className="stat-icon">👍</div>
                    <div className="stat-content">
                      <h4>Total Reactions</h4>
                      <p className="stat-number">{totalReactions}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="stat-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                      <h4>Member Since</h4>
                      <p className="stat-text">
                        {user?.joined_at ? new Date(user.joined_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="stat-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className="stat-icon">🏢</div>
                    <div className="stat-content">
                      <h4>Department</h4>
                      <p className="stat-text">{user?.department || "N/A"}</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* DEPARTMENT STATS */}
              {departmentStats && (
                <div className="mb-8">
                  <h4 className="text-xl font-semibold text-white mb-4">
                    {departmentStats.department} Department Stats
                  </h4>
                  <div className="stats-grid">
                    <motion.div
                      className="stat-card bg-gradient-to-br from-blue-900/30 to-cyan-900/30"
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <div className="stat-icon">👥</div>
                      <div className="stat-content">
                        <h4>Total Members</h4>
                        <p className="stat-number">{departmentStats.total_members}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="stat-card bg-gradient-to-br from-purple-900/30 to-pink-900/30"
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <div className="stat-icon">👨‍💼</div>
                      <div className="stat-content">
                        <h4>Admins</h4>
                        <p className="stat-number">{departmentStats.admin_count}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="stat-card bg-gradient-to-br from-green-900/30 to-emerald-900/30"
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <div className="stat-icon">💼</div>
                      <div className="stat-content">
                        <h4>Employees</h4>
                        <p className="stat-number">{departmentStats.employee_count}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="stat-card bg-gradient-to-br from-amber-900/30 to-orange-900/30"
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <div className="stat-icon">🎉</div>
                      <div className="stat-content">
                        <h4>Department Brags</h4>
                        <p className="stat-number">{departmentStats.total_brags}</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* RECENT ACTIVITY */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-white mb-4">Recent Activity</h4>
                <div className="activity-list">
                  {departmentActivity && departmentActivity.length > 0 ? (
                    departmentActivity.map((activity, index) => (
                      <motion.div
                        key={index}
                        className="activity-item"
                        whileHover={{ x: 10 }}
                      >
                        <span className="activity-icon">✨</span>
                        <div className="activity-content">
                          <p className="font-semibold text-white">{activity.description}</p>
                          <span className="activity-time text-xs">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-gray-400">No recent activity</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* BRAGS TAB */}
          {activeTab === "brags" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="section-title">My Brags 🎯</h3>
                <motion.button
                  className="create-brag-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBragForm(!showBragForm)}
                >
                  <span className="btn-icon">{showBragForm ? "✕" : "✨"}</span>
                  {showBragForm ? "Cancel" : "Create Brag"}
                </motion.button>
              </div>

              {/* Brag Form */}
              {showBragForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="brag-form-container mb-8"
                >
                  <div className="brag-form-header">
                    <h4 className="brag-form-title">✨ Create a Shout-out</h4>
                    <p className="brag-form-subtitle">Celebrate achievements and recognize your colleagues</p>
                  </div>

                  {bragError && (
                    <div className="brag-error-message">
                      <span className="error-icon">⚠️</span>
                      {bragError}
                    </div>
                  )}

                  <div className="brag-form-group">
                    <label className="brag-form-label">
                      <span className="label-icon">🎯</span>
                      What achievement would you like to celebrate?
                    </label>
                    <div className="textarea-container">
                      <textarea
                        value={bragContent}
                        onChange={(e) => setBragContent(e.target.value)}
                        placeholder="Share your accomplishment, milestone, or something you're proud of..."
                        className="brag-textarea"
                        rows={4}
                        maxLength={1000}
                      />
                      <div className="character-count">
                        {bragContent.length}/1000
                      </div>
                    </div>
                  </div>

                  <div className="brag-form-group">
                    <label className="brag-form-label">
                      <span className="label-icon">👥</span>
                      Tag Recipients
                      <span className="label-subtitle">(who should receive this shout-out?)</span>
                    </label>
                    <div className="recipients-grid">
                      {allUsers
                        .filter(member => member.id !== user?.id) // Don't allow tagging yourself
                        .map((member) => (
                        <motion.div
                          key={member.id}
                          className={`recipient-card ${selectedRecipients.includes(member.id) ? 'selected' : ''}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRecipientToggle(member.id)}
                        >
                          <div className="recipient-avatar">
                            {member.name?.charAt(0) || "U"}
                          </div>
                          <div className="recipient-info">
                            <div className="recipient-name">{member.name}</div>
                            <div className="recipient-email">{member.email}</div>
                            <div className="recipient-dept">{member.department}</div>
                          </div>
                          {selectedRecipients.includes(member.id) && (
                            <div className="recipient-checkmark">✓</div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    {selectedRecipients.length > 0 && (
                      <div className="recipients-summary">
                        <span className="summary-icon">🎉</span>
                        Selected: {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="brag-form-group">
                    <label className="brag-form-label">
                      <span className="label-icon">📎</span>
                      Attachments
                      <span className="label-subtitle">(optional - add images to celebrate your achievement)</span>
                    </label>
                    <div className="file-upload-container">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="file-input"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="file-upload-label">
                        <span className="upload-icon">📁</span>
                        Choose Images
                        <span className="upload-subtitle">PNG, JPG, GIF up to 10MB each</span>
                      </label>
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="selected-files">
                        {selectedFiles.map((file, index) => (
                          <motion.div
                            key={index}
                            className="file-preview"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <div className="file-info">
                              <span className="file-name">{file.name}</span>
                              <span className="file-size">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                            </div>
                            <button
                              type="button"
                              className="remove-file-btn"
                              onClick={() => removeFile(index)}
                            >
                              ✕
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="brag-form-actions">
                    <motion.button
                      className="brag-submit-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateBrag}
                      disabled={bragLoading}
                    >
                      {bragLoading ? (
                        <>
                          <div className="loading-spinner"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">🚀</span>
                          Send Shout-out
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      className="brag-cancel-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowBragForm(false);
                        setBragContent("");
                        setSelectedRecipients([]);
                        setSelectedFiles([]);
                        setBragError("");
                      }}
                    >
                      <span className="btn-icon">✕</span>
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Brags List */}
              {userBrags.length > 0 ? (
                <div className="brags-list">
                  {userBrags.map((brag) => (
                    <motion.div
                      key={brag.id}
                      className="brag-card"
                      whileHover={{ scale: 1.01, y: -2 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="brag-header">
                        <div className="brag-avatar">
                          {brag.author.name?.charAt(0) || "U"}
                        </div>
                        <div className="brag-meta">
                          <div className="brag-author">{brag.author.name} ({brag.author.department})</div>
                          <div className="brag-date">
                            {new Date(brag.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="brag-badge">🎉 Shout-out</div>
                        <button
                          className="delete-brag-btn"
                          onClick={() => handleDeleteBrag(brag.id)}
                          title="Delete brag"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="brag-content">
                        {brag.content}
                      </div>

                      {brag.attachments && brag.attachments.length > 0 && (
                        <div className="brag-attachments">
                          {brag.attachments.map((attachment) => (
                            <div key={attachment.id} className="brag-attachment">
                              {attachment.content_type.startsWith('image/') ? (
                                <img
                                  src={`http://localhost:8000/uploads/${attachment.filename}`}
                                  alt={attachment.original_filename}
                                  className="brag-attachment-image"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="brag-attachment-file">
                                  <span className="file-icon">📎</span>
                                  <span className="file-name">{attachment.original_filename}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="brag-recipients">
                        <div className="recipients-label">
                          <span className="recipients-icon">👥</span>
                          Tagged:
                        </div>
                        <div className="recipients-tags">
                          {brag.recipients.map((recipient) => (
                            <span key={recipient.id} className="recipient-tag">
                              @{recipient.name} ({recipient.department})
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="brag-reactions">
                        <div className="reaction-buttons">
                          <button
                            className={`reaction-btn ${getUserReaction(brag.id) === 'like' ? 'active' : ''}`}
                            onClick={() => handleReaction(brag.id, 'like')}
                            title="Like"
                          >
                            👍 {getReactionCount(brag.reactions, 'like')}
                          </button>
                          <button
                            className={`reaction-btn ${getUserReaction(brag.id) === 'clap' ? 'active' : ''}`}
                            onClick={() => handleReaction(brag.id, 'clap')}
                            title="Clap"
                          >
                            👏 {getReactionCount(brag.reactions, 'clap')}
                          </button>
                          <button
                            className={`reaction-btn ${getUserReaction(brag.id) === 'star' ? 'active' : ''}`}
                            onClick={() => handleReaction(brag.id, 'star')}
                            title="Star"
                          >
                            ⭐ {getReactionCount(brag.reactions, 'star')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="empty-brags">
                  <div className="empty-icon">🎯</div>
                  <h3 className="empty-title">No brags yet</h3>
                  <p className="empty-subtitle">
                    Start by sharing your achievements and giving shout-outs to your colleagues!
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* FEED TAB */}
          {activeTab === "feed" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <div className="feed-header">
                <h3 className="section-title">Community Feed 📰</h3>
                <motion.button
                  className="filter-toggle-btn"
                  onClick={() => setShowFilters(!showFilters)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="filter-icon">🔍</span>
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </motion.button>
              </div>

              {/* FILTERS */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="feed-filters"
                >
                  <div className="filters-grid">
                    <div className="filter-group">
                      <label className="filter-label">Department</label>
                      <select
                        value={feedFilters.department}
                        onChange={(e) => handleFilterChange('department', e.target.value)}
                        className="filter-select"
                      >
                        <option value="">All Departments</option>
                        {allDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Sender</label>
                      <select
                        value={feedFilters.sender}
                        onChange={(e) => handleFilterChange('sender', e.target.value)}
                        className="filter-select"
                      >
                        <option value="">All Senders</option>
                        {allUsers.map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">From Date</label>
                      <input
                        type="date"
                        value={feedFilters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        className="filter-input"
                      />
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">To Date</label>
                      <input
                        type="date"
                        value={feedFilters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-actions">
                    <motion.button
                      className="clear-filters-btn"
                      onClick={clearFilters}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear Filters
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* FEED BRAGS */}
              {feedLoading ? (
                <div className="feed-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading feed...</p>
                </div>
              ) : feedBrags.length > 0 ? (
                <div className="feed-brags">
                  {(() => {
                    // Group brags by department
                    const groupedBrags = feedBrags.reduce((acc, brag) => {
                      const dept = brag.author.department || 'No Department';
                      if (!acc[dept]) acc[dept] = [];
                      acc[dept].push(brag);
                      return acc;
                    }, {});

                    return Object.entries(groupedBrags).map(([department, brags]) => (
                      <div key={department} className="department-section">
                        <div className="department-header">
                          <h3 className="department-title">{department} Department</h3>
                          <span className="department-count">{brags.length} post{brags.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="department-brags">
                          {brags.map((brag) => (
                            <motion.div
                              key={brag.id}
                              className="feed-brag-card"
                              whileHover={{ scale: 1.01, y: -2 }}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="feed-brag-header">
                                <div className="feed-brag-avatar">
                                  {brag.author.name?.charAt(0) || "U"}
                                </div>
                                <div className="feed-brag-meta">
                                  <div className="feed-brag-author">{brag.author.name} ({brag.author.department})</div>
                                  <div className="feed-brag-date">
                                    {new Date(brag.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                                <div className="feed-brag-badge">🎉 Shout-out</div>
                              </div>

                              <div className="feed-brag-content">
                                {brag.content}
                              </div>

                              
                              <div className="feed-brag-recipients">
                                <div className="feed-recipients-label">
                                  <span className="recipients-icon">👥</span>
                                  Tagged:
                                </div>
                                <div className="feed-recipients-tags">
                                  {brag.recipients.map((recipient) => (
                                    <span key={recipient.id} className="feed-recipient-tag">
                                      @{recipient.name} ({recipient.department})
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {brag.attachments && brag.attachments.length > 0 && (
                                <div className="feed-brag-attachments">
                                  <div className="attachments-grid">
                                    {brag.attachments.map((attachment) => (
                                      <div key={attachment.id} className="attachment-item">
                                        <img
                                          src={`http://localhost:8000/uploads/${attachment.filename}`}
                                          alt={attachment.original_filename}
                                          className="attachment-image"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                        <div className="attachment-fallback" style={{ display: 'none' }}>
                                          <span className="fallback-icon">📎</span>
                                          <span className="fallback-name">{attachment.original_filename}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="feed-brag-reactions">
                                <div className="reaction-buttons">
                                  <button
                                    className={`reaction-btn ${getUserReaction(brag.id) === 'like' ? 'active' : ''}`}
                                    onClick={() => handleReaction(brag.id, 'like')}
                                    title="Like"
                                  >
                                    👍 {getReactionCount(brag.reactions, 'like')}
                                  </button>
                                  <button
                                    className={`reaction-btn ${getUserReaction(brag.id) === 'clap' ? 'active' : ''}`}
                                    onClick={() => handleReaction(brag.id, 'clap')}
                                    title="Clap"
                                  >
                                    👏 {getReactionCount(brag.reactions, 'clap')}
                                  </button>
                                  <button
                                    className={`reaction-btn ${getUserReaction(brag.id) === 'star' ? 'active' : ''}`}
                                    onClick={() => handleReaction(brag.id, 'star')}
                                    title="Star"
                                  >
                                    ⭐ {getReactionCount(brag.reactions, 'star')}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="feed-empty">
                  <div className="feed-empty-icon">📰</div>
                  <h3 className="feed-empty-title">No shout-outs found</h3>
                  <p className="feed-empty-subtitle">
                    {Object.values(feedFilters).some(v => v) 
                      ? "Try adjusting your filters or be the first to share an achievement!"
                      : "Be the first to share an achievement and celebrate your team's success!"
                    }
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="section-title">User Profile 👤</h3>
                {!isEditingProfile && (
                  <motion.button
                    onClick={handleEditClick}
                    className="edit-profile-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✏️ Edit Profile
                  </motion.button>
                )}
              </div>

              {!isEditingProfile ? (
                // VIEW MODE
                <div className="profile-card">
                  <div className="profile-header mb-6">
                    <div className="profile-avatar text-4xl flex items-center justify-center">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                    <div className="profile-info">
                      <h4 className="text-2xl font-bold text-white">{user?.name}</h4>
                      <p className="text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                  <div className="profile-details space-y-4">
                    <div className="profile-row p-4 rounded-lg bg-slate-800/30 border border-slate-600/20">
                      <span className="profile-label text-gray-400 block text-sm mb-1">Full Name</span>
                      <span className="profile-value text-white font-semibold">{user?.name}</span>
                    </div>
                    <div className="profile-row p-4 rounded-lg bg-slate-800/30 border border-slate-600/20">
                      <span className="profile-label text-gray-400 block text-sm mb-1">Email</span>
                      <span className="profile-value text-white font-semibold">{user?.email}</span>
                    </div>
                    <div className="profile-row p-4 rounded-lg bg-slate-800/30 border border-slate-600/20">
                      <span className="profile-label text-gray-400 block text-sm mb-1">Department</span>
                      <span className="profile-value text-white font-semibold">{user?.department || "Not specified"}</span>
                    </div>
                    <div className="profile-row p-4 rounded-lg bg-slate-800/30 border border-slate-600/20">
                      <span className="profile-label text-gray-400 block text-sm mb-1">Role</span>
                      <span className="profile-value text-white font-semibold capitalize">{user?.role || "Employee"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                // EDIT MODE
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="profile-card"
                >
                  {editError && (
                    <div className="profile-error-message">
                      ⚠️ {editError}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Full Name Field */}
                    <div className="profile-form-group">
                      <label className="profile-form-label">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => handleEditChange("name", e.target.value)}
                        className="profile-form-input"
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email Field */}
                    <div className="profile-form-group">
                      <label className="profile-form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => handleEditChange("email", e.target.value)}
                        className="profile-form-input"
                        placeholder="Enter your email"
                      />
                    </div>

                    {/* Department Field */}
                    <div className="profile-form-group">
                      <label className="profile-form-label">
                        Department
                      </label>
                      <input
                        type="text"
                        value={editFormData.department}
                        onChange={(e) => handleEditChange("department", e.target.value)}
                        className="profile-form-input"
                        placeholder="Enter your department"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <motion.button
                        onClick={handleSaveProfile}
                        disabled={editLoading}
                        className="save-profile-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {editLoading ? "Saving..." : "💾 Save Changes"}
                      </motion.button>
                      <motion.button
                        onClick={handleCancelEdit}
                        disabled={editLoading}
                        className="cancel-profile-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        ❌ Cancel
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
