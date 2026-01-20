/* eslint-disable no-unused-vars */
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import { motion } from "framer-motion";
import api from "../api";
import { jsPDF } from "jspdf";
import Papa from "papaparse";
import Leaderboard from "./Leaderboard";
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
    role: "",
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
  const [commentInputs, setCommentInputs] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [showReactions, setShowReactions] = useState({});
  const [topContributors, setTopContributors] = useState([]);
  const [mostTagged, setMostTagged] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [reportedBrags, setReportedBrags] = useState([]);
  const [reportStats, setReportStats] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFormData, setReportFormData] = useState({ bragId: null, reason: '', description: '' });
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportResolveData, setReportResolveData] = useState({ status: 'resolved', adminNotes: '' });



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

        // ALWAYS fetch admin data - for continuous user displaying
        const fetchAdminData = async () => {
          try {
            console.log("Fetching admin data...");
            const [contributorsResponse, taggedResponse, reportsResponse, reportStatsResponse] = await Promise.all([
              api.get("/users/admin/top-contributors?limit=10").catch(err => {
                console.error("Top contributors error:", err.response?.status, err.response?.data);
                return { data: [] };
              }),
              api.get("/users/admin/most-tagged?limit=10").catch(err => {
                console.error("Most tagged error:", err.response?.status, err.response?.data);
                return { data: [] };
              }),
              api.get("/reports/admin?limit=50").catch(err => {
                console.error("Reports error:", err.response?.status, err.response?.data);
                return { data: [] };
              }),
              api.get("/users/admin/report-stats").catch(err => {
                console.error("Report stats error:", err.response?.status, err.response?.data);
                return { data: {} };
              })
            ]);
            
            console.log("Admin data fetched:", {
              contributors: contributorsResponse.data,
              tagged: taggedResponse.data,
              reports: reportsResponse.data,
              stats: reportStatsResponse.data
            });
            
            setTopContributors(contributorsResponse.data || []);
            setMostTagged(taggedResponse.data || []);
            setReportedBrags(reportsResponse.data || []);
            setReportStats(reportStatsResponse.data || {});
          } catch (err) {
            console.warn("Admin data fetch error:", err);
          }
        };
        
        // Fetch admin data immediately and also if user is admin
        await fetchAdminData();
        
        // Verify user role
        if (userResponse.data) {
          console.log("User role:", userResponse.data.role);
          if (userResponse.data.role === 'admin') {
            console.log("User is admin - data already fetched");
          } else {
            console.log("User is not admin - still displaying admin data for all users");
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, navigate]);

  // Continuously refresh admin data every 30 seconds
  useEffect(() => {
    const refreshAdminData = async () => {
      try {
        const [contributorsResponse, taggedResponse, reportsResponse, reportStatsResponse] = await Promise.all([
          api.get("/users/admin/top-contributors?limit=10").catch(err => ({ data: [] })),
          api.get("/users/admin/most-tagged?limit=10").catch(err => ({ data: [] })),
          api.get("/reports/admin?limit=50").catch(err => ({ data: [] })),
          api.get("/users/admin/report-stats").catch(err => ({ data: {} }))
        ]);
        
        setTopContributors(contributorsResponse.data || []);
        setMostTagged(taggedResponse.data || []);
        setReportedBrags(reportsResponse.data || []);
        setReportStats(reportStatsResponse.data || {});
      } catch (err) {
        console.warn("Periodic admin data refresh failed:", err);
      }
    };

    // Refresh admin data every 30 seconds for continuous display
    const interval = setInterval(refreshAdminData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Load reports when admin tab is clicked
  useEffect(() => {
    if (activeTab === "admin" && user?.role === "admin") {
      fetchReportedBrags();
    }
  }, [activeTab, user?.role]);

  // Initialize edit form when user data loads
  useEffect(() => {
    if (user && !isEditingProfile) {
      setEditFormData({
        name: user.name || "",
        email: user.email || "",
        department: user.department || "",
        role: user.role || "employee",
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
        role: user.role || "employee",
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

  const handleAddComment = async (bragId) => {
    const content = commentInputs[bragId]?.trim();
    if (!content) return;

    setCommentLoading(prev => ({ ...prev, [bragId]: true }));
    try {
      await api.post(`/brags/${bragId}/comments`, { content });
      
      // Clear input
      setCommentInputs(prev => ({ ...prev, [bragId]: '' }));
      
      // Refresh the brags
      const bragsResponse = await api.get("/brags/my");
      setUserBrags(bragsResponse.data || []);
      
      // Refresh feed if needed
      if (activeTab === 'feed') {
        fetchFeedBrags(feedFilters);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setCommentLoading(prev => ({ ...prev, [bragId]: false }));
    }
  };

  const handleDeleteComment = async (bragId, commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/brags/${bragId}/comments/${commentId}`);
      
      // Refresh the brags
      const bragsResponse = await api.get("/brags/my");
      setUserBrags(bragsResponse.data || []);
      
      // Refresh feed if needed
      if (activeTab === 'feed') {
        fetchFeedBrags(feedFilters);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const toggleComments = (bragId) => {
    setShowComments(prev => ({ ...prev, [bragId]: !prev[bragId] }));
  };

  const toggleReactions = (bragId) => {
    setShowReactions(prev => ({ ...prev, [bragId]: !prev[bragId] }));
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

  // Report handling functions
  const handleReportBrag = async (bragId) => {
    setShowReportModal(true);
    setReportFormData({ bragId, reason: '', description: '' });
    setReportError("");
  };

  const submitReport = async () => {
    if (!reportFormData.reason.trim()) {
      setReportError("Please select a reason");
      setReportLoading(false);
      return;
    }

    if (!reportFormData.bragId) {
      setReportError("Invalid brag ID");
      setReportLoading(false);
      return;
    }

    setReportLoading(true);
    setReportError("");
    setReportSuccess("");

    try {
      console.log("Submitting report for brag:", reportFormData.bragId);
      console.log("Report data:", {
        reason: reportFormData.reason,
        description: reportFormData.description || ""
      });

      const response = await api.post(`/brags/${reportFormData.bragId}/reports`, {
        reason: reportFormData.reason,
        description: reportFormData.description || ""
      });

      console.log("Report submitted successfully:", response.data);

      // Show success message
      setReportSuccess("Report submitted successfully! Thank you for helping keep our community safe.");
      
      // Reset form
      setReportFormData({ bragId: null, reason: '', description: '' });
      setReportLoading(false);
      
      // Close modal after 2 seconds to show success message
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess("");
      }, 2000);

      // Refresh admin reports if viewing admin tab
      if (activeTab === "admin") {
        try {
          const reportsResponse = await api.get("/reports/admin?limit=50");
          setReportedBrags(reportsResponse.data || []);
          console.log("Reports refreshed:", reportsResponse.data);
        } catch (err) {
          console.warn("Could not refresh reports:", err);
        }
      }

      // Also refresh the feed to remove/update the reported brag
      try {
        await fetchFeedBrags();
      } catch (err) {
        console.warn("Could not refresh feed:", err);
      }

    } catch (error) {
      console.error("Report submission error:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || "Failed to submit report";
      setReportError(errorMessage);
      setReportLoading(false);
    }
  };

  const fetchReportedBrags = async () => {
    try {
      console.log("Fetching reported brags...");
      const response = await api.get("/reports/admin?limit=50");
      console.log("Fetched reports:", response.data);
      setReportedBrags(response.data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReportedBrags([]); // Set empty array on error
    }
  };

  const handleResolveReport = async () => {
    setReportLoading(true);
    try {
      await api.put(`/reports/${selectedReport.id}`, {
        status: reportResolveData.status,
        resolution_notes: reportResolveData.adminNotes
      });
      
      setShowReportDetail(false);
      setSelectedReport(null);
      await fetchReportedBrags();
      alert("Report resolved successfully");
    } catch (error) {
      console.error("Error resolving report:", error);
      alert("Failed to resolve report");
    } finally {
      setReportLoading(false);
    }
  };

  // Export functions for reports
  const exportReportsAsCSV = () => {
    if (!reportedBrags || reportedBrags.length === 0) {
      alert("No reports to export");
      return;
    }

    const csvData = reportedBrags.map(report => ({
      "Report ID": report.id,
      "Reporter": report.reported_by?.name || "Unknown",
      "Reporter Email": report.reported_by?.email || "N/A",
      "Reason": report.reason,
      "Status": report.status,
      "Description": report.description || "",
      "Created Date": new Date(report.created_at).toLocaleString(),
      "Resolved Date": report.resolved_at ? new Date(report.resolved_at).toLocaleString() : "N/A",
      "Resolved By": report.resolved_by?.name || "N/A",
      "Admin Notes": report.resolution_notes || ""
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReportsAsPDF = () => {
    if (!reportedBrags || reportedBrags.length === 0) {
      alert("No reports to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // Title
    doc.setFontSize(18);
    doc.text("Reported Shout-outs Report", pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Summary
    doc.setFontSize(12);
    doc.text("Summary", 10, yPosition);
    yPosition += 6;
    doc.setFontSize(10);
    doc.text(`Total Reports: ${reportStats?.total_reports || 0}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Pending: ${reportStats?.pending_reports || 0}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Resolved: ${reportStats?.resolved_reports || 0}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Dismissed: ${reportStats?.dismissed_reports || 0}`, 15, yPosition);
    yPosition += 10;

    // Reports Details
    doc.setFontSize(12);
    doc.text("Reports Details", 10, yPosition);
    yPosition += 8;

    reportedBrags.forEach((report, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 10;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`Report #${index + 1}`, 10, yPosition);
      yPosition += 5;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const reportDetails = [
        `ID: ${report.id}`,
        `Reporter: ${report.reported_by?.name || 'Unknown'}`,
        `Reason: ${report.reason}`,
        `Status: ${report.status}`,
        `Created: ${new Date(report.created_at).toLocaleString()}`,
        `Description: ${report.description || 'N/A'}`,
        `Admin Notes: ${report.resolution_notes || 'N/A'}`
      ];

      reportDetails.forEach(detail => {
        if (yPosition > pageHeight - 10) {
          doc.addPage();
          yPosition = 10;
        }
        doc.text(detail, 15, yPosition);
        yPosition += 4;
      });

      yPosition += 3;
    });

    doc.save(`reports_${new Date().toISOString().split('T')[0]}.pdf`);
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
            className={`nav-item ${activeTab === "leaderboard" ? "active" : ""}`}
            onClick={() => setActiveTab("leaderboard")}
            whileHover={{ x: 5 }}
          >
            🏆 Leaderboard
          </motion.button>
          <motion.button
            className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
            whileHover={{ x: 5 }}
          >
            👤 Profile
          </motion.button>
          {user?.role === 'admin' && (
            <motion.button
              className={`nav-item ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
              whileHover={{ x: 5 }}
            >
              ⚙️ Admin Dashboard
            </motion.button>
          )}
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
                          className="report-brag-btn"
                          onClick={() => handleReportBrag(brag.id)}
                          title="Report brag"
                        >
                          ⚠️
                        </button>
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

                      <div className="brag-reactions">
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

                        <button
                          className="reactions-toggle-btn"
                          onClick={() => toggleReactions(brag.id)}
                        >
                          👀 Reactions ({brag.reactions?.length || 0})
                        </button>

                        <button
                          className="comments-toggle-btn"
                          onClick={() => toggleComments(brag.id)}
                        >
                          💬 Comments ({brag.comments?.length || 0})
                        </button>
                        
                        {showReactions[brag.id] && (
                          <div className="reactions-section">
                            {brag.reactions && brag.reactions.length > 0 && (
                              <div className="reactions-list">
                                {brag.reactions.map((reaction) => (
                                  <div key={reaction.id} className="reaction-item">
                                    <div className="reaction-header">
                                      <div className="reaction-avatar">
                                        {reaction.user.name?.charAt(0) || "U"}
                                      </div>
                                      <div className="reaction-meta">
                                        <span className="reaction-author">{reaction.user.name}</span>
                                        <span className="reaction-type">
                                          {reaction.reaction_type === 'like' ? '👍' : reaction.reaction_type === 'clap' ? '👏' : '⭐'}
                                        </span>
                                        <span className="reaction-date">
                                          {new Date(reaction.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="brag-comments">
                        {showComments[brag.id] && (
                          <div className="comments-section">
                            {brag.comments && brag.comments.length > 0 && (
                              <div className="comments-list">
                                {brag.comments.map((comment) => (
                                  <div key={comment.id} className="comment-item">
                                    <div className="comment-header">
                                      <div className="comment-avatar">
                                        {comment.user.name?.charAt(0) || "U"}
                                      </div>
                                      <div className="comment-meta">
                                        <span className="comment-author">{comment.user.name}</span>
                                        <span className="comment-date">
                                          {new Date(comment.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      {comment.user.id === user?.id && (
                                        <button
                                          className="delete-comment-btn"
                                          onClick={() => handleDeleteComment(brag.id, comment.id)}
                                          title="Delete comment"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                    <div className="comment-content">{comment.content}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="add-comment">
                              <textarea
                                value={commentInputs[brag.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [brag.id]: e.target.value }))}
                                placeholder="Add a comment..."
                                className="comment-input"
                                rows="2"
                                maxLength="500"
                              />
                              <button
                                className="comment-submit-btn"
                                onClick={() => handleAddComment(brag.id)}
                                disabled={!commentInputs[brag.id]?.trim() || commentLoading[brag.id]}
                              >
                                {commentLoading[brag.id] ? 'Posting...' : 'Comment'}
                              </button>
                            </div>
                          </div>
                        )}
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
                                <button
                                  className="report-brag-btn"
                                  onClick={() => handleReportBrag(brag.id)}
                                  title="Report brag"
                                >
                                  ⚠️
                                </button>
                              </div>

                              <div className="feed-brag-content">
                                {brag.content}
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

                                <button
                                  className="reactions-toggle-btn"
                                  onClick={() => toggleReactions(brag.id)}
                                >
                                  👀 Reactions ({brag.reactions?.length || 0})
                                </button>

                                <button
                                  className="comments-toggle-btn"
                                  onClick={() => toggleComments(brag.id)}
                                >
                                  💬 Comments ({brag.comments?.length || 0})
                                </button>
                                
                                {showReactions[brag.id] && (
                                  <div className="reactions-section">
                                    {brag.reactions && brag.reactions.length > 0 && (
                                      <div className="reactions-list">
                                        {brag.reactions.map((reaction) => (
                                          <div key={reaction.id} className="reaction-item">
                                            <div className="reaction-header">
                                              <div className="reaction-avatar">
                                                {reaction.user.name?.charAt(0) || "U"}
                                              </div>
                                              <div className="reaction-meta">
                                                <span className="reaction-author">{reaction.user.name}</span>
                                                <span className="reaction-type">
                                                  {reaction.reaction_type === 'like' ? '👍' : reaction.reaction_type === 'clap' ? '👏' : '⭐'}
                                                </span>
                                                <span className="reaction-date">
                                                  {new Date(reaction.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="feed-brag-comments">
                                {showComments[brag.id] && (
                                  <div className="comments-section">
                                    {brag.comments && brag.comments.length > 0 && (
                                      <div className="comments-list">
                                        {brag.comments.map((comment) => (
                                          <div key={comment.id} className="comment-item">
                                            <div className="comment-header">
                                              <div className="comment-avatar">
                                                {comment.user.name?.charAt(0) || "U"}
                                              </div>
                                              <div className="comment-meta">
                                                <span className="comment-author">{comment.user.name}</span>
                                                <span className="comment-date">
                                                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })}
                                                </span>
                                              </div>
                                              {comment.user.id === user?.id && (
                                                <button
                                                  className="delete-comment-btn"
                                                  onClick={() => handleDeleteComment(brag.id, comment.id)}
                                                  title="Delete comment"
                                                >
                                                  🗑️
                                                </button>
                                              )}
                                            </div>
                                            <div className="comment-content">{comment.content}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    <div className="add-comment">
                                      <textarea
                                        value={commentInputs[brag.id] || ''}
                                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [brag.id]: e.target.value }))}
                                        placeholder="Add a comment..."
                                        className="comment-input"
                                        rows="2"
                                        maxLength="500"
                                      />
                                      <button
                                        className="comment-submit-btn"
                                        onClick={() => handleAddComment(brag.id)}
                                        disabled={!commentInputs[brag.id]?.trim() || commentLoading[brag.id]}
                                      >
                                        {commentLoading[brag.id] ? 'Posting...' : 'Comment'}
                                      </button>
                                    </div>
                                  </div>
                                )}
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

                    {/* Role Field */}
                    <div className="profile-form-group">
                      <label className="profile-form-label">
                        Role
                      </label>
                      <select
                        value={editFormData.role}
                        onChange={(e) => handleEditChange("role", e.target.value)}
                        className="profile-form-input"
                      >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
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

          {/* LEADERBOARD TAB */}
          {activeTab === "leaderboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Leaderboard />
            </motion.div>
          )}

          {/* ADMIN DASHBOARD TAB */}
          {activeTab === "admin" && user?.role === "admin" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <h3 className="section-title mb-8">Admin Dashboard ⚙️</h3>

              <div className="admin-grid">
                {/* Top Contributors Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="admin-section"
                >
                  <div className="admin-section-header">
                    <h4 className="admin-section-title">🏆 Top Contributors</h4>
                    <p className="admin-section-subtitle">Most active brag authors</p>
                  </div>

                  {adminLoading ? (
                    <div className="loading-spinner"></div>
                  ) : topContributors.length > 0 ? (
                    <div className="contributors-list">
                      {topContributors.map((contributor, index) => (
                        <motion.div
                          key={contributor.id}
                          className="contributor-card"
                          whileHover={{ scale: 1.02, x: 5 }}
                        >
                          <div className="contributor-rank">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                          </div>
                          <div className="contributor-avatar">
                            {contributor.name?.charAt(0) || "U"}
                          </div>
                          <div className="contributor-info">
                            <div className="contributor-name">{contributor.name}</div>
                            <div className="contributor-dept">{contributor.department || "No Dept"}</div>
                            <div className="contributor-email">{contributor.email}</div>
                          </div>
                          <div className="contributor-stat">
                            <div className="stat-value">{contributor.brag_count}</div>
                            <div className="stat-label">Brags</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No contributors yet</p>
                    </div>
                  )}
                </motion.div>

                {/* Most Tagged Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="admin-section"
                >
                  <div className="admin-section-header">
                    <h4 className="admin-section-title">⭐ Most Tagged Users</h4>
                    <p className="admin-section-subtitle">Most frequently recognized</p>
                  </div>

                  {adminLoading ? (
                    <div className="loading-spinner"></div>
                  ) : mostTagged.length > 0 ? (
                    <div className="tagged-list">
                      {mostTagged.map((user_item, index) => (
                        <motion.div
                          key={user_item.id}
                          className="tagged-card"
                          whileHover={{ scale: 1.02, x: 5 }}
                        >
                          <div className="tagged-rank">
                            {index === 0 ? "⭐" : index === 1 ? "✨" : index === 2 ? "💫" : `#${index + 1}`}
                          </div>
                          <div className="tagged-avatar">
                            {user_item.name?.charAt(0) || "U"}
                          </div>
                          <div className="tagged-info">
                            <div className="tagged-name">{user_item.name}</div>
                            <div className="tagged-dept">{user_item.department || "No Dept"}</div>
                            <div className="tagged-email">{user_item.email}</div>
                          </div>
                          <div className="tagged-stat">
                            <div className="stat-value">{user_item.tagged_count}</div>
                            <div className="stat-label">Mentions</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No tagged users yet</p>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Reports Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="admin-reports-section mt-8"
              >
                <div className="admin-section-header">
                  <div className="section-header-with-actions">
                    <h3 className="section-title">📋 Reported Shout-outs</h3>
                    <div className="export-buttons">
                      <motion.button
                        className="export-btn csv-btn"
                        onClick={exportReportsAsCSV}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Export as CSV"
                      >
                        📊 Export CSV
                      </motion.button>
                      <motion.button
                        className="export-btn pdf-btn"
                        onClick={exportReportsAsPDF}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Export as PDF"
                      >
                        📄 Export PDF
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Report Statistics */}
                {reportStats && (
                  <div className="report-stats-grid">
                    <div className="stat-card">
                      <div className="stat-number">{reportStats.total_reports}</div>
                      <div className="stat-label">Total Reports</div>
                    </div>
                    <div className="stat-card pending">
                      <div className="stat-number">{reportStats.pending_reports}</div>
                      <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-card resolved">
                      <div className="stat-number">{reportStats.resolved_reports}</div>
                      <div className="stat-label">Resolved</div>
                    </div>
                    <div className="stat-card dismissed">
                      <div className="stat-number">{reportStats.dismissed_reports}</div>
                      <div className="stat-label">Dismissed</div>
                    </div>
                  </div>
                )}

                {/* Reports List */}
                {reportedBrags && reportedBrags.length > 0 ? (
                  <div className="reports-list">
                    {reportedBrags.map((report) => (
                      <motion.div
                        key={report.id}
                        className={`report-card ${report.status}`}
                        whileHover={{ scale: 1.01, y: -2 }}
                      >
                        <div className="report-header">
                          <div className="report-status-badge">
                            {report.status === 'pending' ? '⏳ Pending' : report.status === 'resolved' ? '✅ Resolved' : '❌ Dismissed'}
                          </div>
                          <div className="report-info">
                            <div className="report-reason">Reason: <strong>{report.reason}</strong></div>
                            <div className="report-reporter">Reported by: <strong>{report.reported_by.name}</strong></div>
                            <div className="report-date">
                              {new Date(report.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <motion.button
                            className="view-report-btn"
                            onClick={() => {
                              setSelectedReport(report);
                              setShowReportDetail(true);
                              setReportResolveData({ status: 'resolved', adminNotes: '' });
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View Details →
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No reports yet</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Report Modal */}
      {showReportModal && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowReportModal(false)}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Report Shout-out</h2>
            <p className="modal-subtitle">Help us keep our community safe and respectful</p>

            {reportSuccess && (
              <motion.div 
                className="success-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  border: '1px solid #c3e6cb',
                  textAlign: 'center',
                  fontWeight: '500'
                }}
              >
                ✓ {reportSuccess}
              </motion.div>
            )}

            {reportError && <div className="error-message">{reportError}</div>}

            {!reportSuccess && (
              <>
                <div className="form-group">
                  <label>Select Reason *</label>
                  <select
                    value={reportFormData.reason}
                    onChange={(e) => setReportFormData({...reportFormData, reason: e.target.value})}
                    className="form-select"
                  >
                    <option value="">-- Select a reason --</option>
                    <option value="inappropriate">Inappropriate Content</option>
                    <option value="harassment">Harassment or Bullying</option>
                    <option value="spam">Spam</option>
                    <option value="offensive">Offensive Language</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Additional Details (Optional)</label>
                  <textarea
                    value={reportFormData.description}
                    onChange={(e) => setReportFormData({...reportFormData, description: e.target.value})}
                    placeholder="Provide more context about why you're reporting this..."
                    maxLength="500"
                    className="form-textarea"
                    rows="4"
                  />
                  <div className="char-count">{reportFormData.description.length}/500</div>
                </div>

                <div className="modal-actions">
                  <motion.button
                    className="submit-btn"
                    onClick={submitReport}
                    disabled={reportLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {reportLoading ? "Submitting..." : "Submit Report"}
                  </motion.button>
                  <motion.button
                    className="cancel-btn"
                    onClick={() => setShowReportModal(false)}
                    disabled={reportLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Report Detail Modal */}
      {showReportDetail && selectedReport && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowReportDetail(false)}
        >
          <motion.div
            className="modal-content large"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Report Details</h2>
            
            <div className="report-details">
              <div className="detail-row">
                <label>Status:</label>
                {selectedReport.status === 'pending' ? (
                  <select
                    value={reportResolveData.status}
                    onChange={(e) => setReportResolveData({...reportResolveData, status: e.target.value})}
                    className="form-select"
                  >
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                ) : (
                  <span className="status-badge">{selectedReport.status}</span>
                )}
              </div>

              <div className="detail-row">
                <label>Reason:</label>
                <span>{selectedReport.reason}</span>
              </div>

              <div className="detail-row">
                <label>Reported by:</label>
                <span>{selectedReport.reported_by.name} ({selectedReport.reported_by.email})</span>
              </div>

              <div className="detail-row">
                <label>Description:</label>
                <span>{selectedReport.description || 'N/A'}</span>
              </div>

              <div className="detail-row">
                <label>Reported Shout-out:</label>
                <div className="reported-brag-preview">
                  <p><strong>Author:</strong> {selectedReport.brag.author.name}</p>
                  <p><strong>Content:</strong> {selectedReport.brag.content}</p>
                  <p><strong>Date:</strong> {new Date(selectedReport.brag.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedReport.status === 'pending' && (
                <div className="form-group">
                  <label>Admin Notes</label>
                  <textarea
                    value={reportResolveData.adminNotes}
                    onChange={(e) => setReportResolveData({...reportResolveData, adminNotes: e.target.value})}
                    placeholder="Add notes about your decision..."
                    maxLength="500"
                    className="form-textarea"
                    rows="4"
                  />
                </div>
              )}

              {selectedReport.status !== 'pending' && (
                <>
                  <div className="detail-row">
                    <label>Resolved by:</label>
                    <span>{selectedReport.resolved_by?.name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Admin Notes:</label>
                    <span>{selectedReport.resolution_notes || 'N/A'}</span>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              {selectedReport.status === 'pending' ? (
                <>
                  <motion.button
                    className="submit-btn"
                    onClick={handleResolveReport}
                    disabled={reportLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {reportLoading ? "Resolving..." : `Mark as ${reportResolveData.status}`}
                  </motion.button>
                  <motion.button
                    className="cancel-btn"
                    onClick={() => setShowReportDetail(false)}
                    disabled={reportLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                </>
              ) : (
                <motion.button
                  className="cancel-btn"
                  onClick={() => setShowReportDetail(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}