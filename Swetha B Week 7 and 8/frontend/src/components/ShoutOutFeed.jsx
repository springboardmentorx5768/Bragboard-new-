import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { FaTrash, FaHeart, FaSignLanguage as FaHandsClapping, FaLaugh, FaPencilAlt, FaChevronDown, FaChevronUp, FaEllipsisV, FaFlag } from "react-icons/fa";

const CommentItem = ({ comment, shoutoutId, onReply, onUpdate, onDelete, onReport, currentUser, isReply = false, parentName = null }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);

  const handleSubmitReply = () => {
    onReply(shoutoutId, replyText, comment.id);
    setIsReplying(false);
    setReplyText("");
  };

  const handleUpdate = () => {
    onUpdate(comment.id, editContent);
    setIsEditing(false);
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <div className={`flex flex-col relative ${isReply ? 'mt-3' : 'mt-4'}`}>
      <div className="flex gap-3 text-sm">
        {/* Avatar */}
        <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm border border-gray-200">
          {comment.user && comment.user.profile_image_url ? (
            <img
              src={`${API_BASE_URL}${comment.user.profile_image_url}`}
              alt={comment.user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-500">{comment.user && comment.user.name ? comment.user.name[0].toUpperCase() : 'U'}</span>
          )}
        </div>

        {/* Comment Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-blue-600 hover:underline cursor-pointer">
              {comment.user ? comment.user.name : `User ${comment.user_id}`}
            </span>
          </div>

          <div className="text-gray-800 text-sm leading-snug">
            {isEditing ? (
              <div className="mt-1 bg-white p-2 rounded border border-gray-200 shadow-inner">
                <input
                  type="text"
                  className="w-full border-none focus:ring-0 text-gray-800 text-sm p-0"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <button onClick={() => setIsEditing(false)} className="text-[10px] text-gray-500 hover:text-gray-700 uppercase font-bold">Cancel</button>
                  <button onClick={handleUpdate} className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 uppercase font-bold">Save</button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>

          {/* Comment Footer / Actions */}
          <div className="flex items-center gap-4 mt-1 text-[11px] text-gray-400">
            <span className="hover:text-gray-600 cursor-default">
              {new Date(comment.created_at + (comment.created_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString()}
            </span>

            <button
              onClick={() => setIsReplying(!isReplying)}
              className="hover:underline text-gray-500 font-medium"
            >
              Reply
            </button>

            {(currentUser && (currentUser.id === comment.user_id || currentUser.role === 'admin' || currentUser.id !== comment.user_id)) && !isEditing && (
              <div className="relative">
                <button onClick={toggleMenu} className="hover:text-gray-600 py-1 flex items-center">
                  <FaEllipsisV size={10} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute left-0 bottom-full mb-1 bg-white shadow-lg rounded border border-gray-100 py-1 w-20 z-20">
                      {currentUser.id === comment.user_id && (
                        <button
                          className="block w-full text-left px-3 py-1 text-[10px] hover:bg-gray-50 text-blue-600 font-bold uppercase"
                          onClick={() => {
                            setIsEditing(true);
                            setEditContent(comment.content);
                            setShowMenu(false);
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {(currentUser.id === comment.user_id || currentUser.role === 'admin') && (
                        <button
                          className="block w-full text-left px-3 py-1 text-[10px] hover:bg-gray-50 text-red-600 font-bold uppercase"
                          onClick={() => {
                            onDelete(comment.id);
                            setShowMenu(false);
                          }}
                        >
                          Delete
                        </button>
                      )}
                      {currentUser.id !== comment.user_id && (
                        <button
                          className="block w-full text-left px-3 py-1 text-[10px] hover:bg-gray-50 text-orange-500 font-bold uppercase"
                          onClick={() => {
                            onReport(comment.id);
                            setShowMenu(false);
                          }}
                        >
                          Report
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Reply Input */}
          {isReplying && (
            <div className="mt-3 flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-100">
              <input
                type="text"
                placeholder="Write a reply..."
                className="flex-1 min-w-0 bg-transparent border-none text-[13px] focus:ring-0 text-gray-800 p-0"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitReply();
                }}
                autoFocus
              />
              <button
                onClick={handleSubmitReply}
                className="text-blue-600 text-[11px] font-bold hover:underline uppercase disabled:opacity-30"
                disabled={!replyText.trim()}
              >
                Post
              </button>
              <button
                onClick={() => setIsReplying(false)}
                className="text-gray-400 text-[11px] font-bold hover:underline uppercase"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Children Comments (Nested) */}
      {comment.children && comment.children.length > 0 && (
        <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 relative">
          {comment.children.map(child => (
            <div key={child.id} className="relative pl-7">
              {/* Horizontal connector line factor */}
              <div className="absolute left-0 top-5 w-7 border-t-2 border-gray-200"></div>
              <CommentItem
                comment={child}
                shoutoutId={shoutoutId}
                onReply={onReply}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onReport={onReport}
                currentUser={currentUser}
                isReply={true}
              />
            </div>
          ))}
        </div>
      )}


    </div>
  );
};

const organizeComments = (comments) => {
  if (!comments) return [];
  const map = {};
  const roots = [];
  // Deep copy to avoid mutating original state references if any
  const nodes = comments.map(c => ({ ...c, children: [] }));

  nodes.forEach(c => {
    map[c.id] = c;
  });

  nodes.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
};

const ShoutOutFeed = ({ refreshTrigger }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    department: '',
    sender_id: '',
    date_start: '',
    date_end: '',
  });
  const [sortBy, setSortBy] = useState('latest');
  const [shoutouts, setShoutouts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [visibleComments, setVisibleComments] = useState({});
  const { token } = useAuth();

  const toggleComments = (shoutoutId) => {
    setVisibleComments(prev => ({
      ...prev,
      [shoutoutId]: !prev[shoutoutId]
    }));
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error("Failed to fetch current user", error);
    }
  };

  const fetchShoutouts = async () => {
    try {
      let url = `${API_BASE_URL}/shoutouts/?`;
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.sender_id) params.append('sender_id', filters.sender_id);
      if (filters.date_start) params.append('date_start', new Date(filters.date_start).toISOString());
      if (filters.date_end) params.append('date_end', new Date(filters.date_end).toISOString());
      params.append('sort_by', sortBy);

      const response = await fetch(`${url}${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setShoutouts(data);
      } else {
        console.error("Failed response");
      }
    } catch (error) {
      console.error("Failed to fetch shoutouts", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchCurrentUser();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchShoutouts();
    }
  }, [filters, sortBy, token, refreshTrigger]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleReaction = async (shoutoutId, type) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shoutouts/${shoutoutId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        body: new URLSearchParams({ type: type })
      });

      if (response.ok) {
        // Optimistic update or refetch
        fetchShoutouts();
      } else {
        console.error("Failed to react");
      }
    } catch (error) {
      console.error("Error reacting:", error);
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, shoutout: null });

  const handleEditClick = (shoutout) => {
    if (shoutout.edit_count >= 2) {
      alert("You have reached the maximum number of edits (2) for this shout-out.");
      return;
    }
    setConfirmModal({ isOpen: true, shoutout });
  };

  const handleConfirmEdit = () => {
    if (confirmModal.shoutout) {
      setEditingId(confirmModal.shoutout.id);
      setEditContent(confirmModal.shoutout.message);
      setConfirmModal({ isOpen: false, shoutout: null });
    }
  };

  const handleUpdate = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shoutouts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        body: new URLSearchParams({ message: editContent })
      });

      if (response.ok) {
        const updatedShoutout = await response.json();
        setShoutouts(shoutouts.map(s => s.id === id ? {
          ...s,
          message: updatedShoutout.message,
          is_edited: updatedShoutout.is_edited,
          edit_count: updatedShoutout.edit_count
        } : s));
        setEditingId(null);
        setEditContent("");
      } else {
        alert("Failed to update shoutout");
      }
    } catch (error) {
      console.error("Error updating", error);
    }
  };

  const [reportModal, setReportModal] = useState({ isOpen: false, targetId: null, type: 'shoutout' }); // type: 'shoutout' | 'comment'
  const [reportReason, setReportReason] = useState("");

  const handleReportClick = (id, type = 'shoutout') => {
    setReportModal({ isOpen: true, targetId: id, type });
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    try {
      let url = "";
      if (reportModal.type === 'shoutout') {
        url = `${API_BASE_URL}/shoutouts/${reportModal.targetId}/report`;
      } else if (reportModal.type === 'comment') {
        url = `${API_BASE_URL}/comments/${reportModal.targetId}/report`;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reportReason })
      });
      if (res.ok) {
        alert("Report submitted. Thank you for helping keep BragBoard safe.");
        setReportModal({ isOpen: false, targetId: null, type: 'shoutout' });
        setReportReason("");
      } else {
        alert("Failed to report.");
      }
    } catch (err) {
      console.error("Error reporting", err);
    }
  };


  const [commentInputs, setCommentInputs] = useState({});

  const handleCommentChange = (shoutoutId, value) => {
    setCommentInputs(prev => ({ ...prev, [shoutoutId]: value }));
  };

  const handlePostComment = async (shoutoutId, content = null, parentId = null) => {
    // If content is passed (reply), use it. Otherwise use the main input state.
    const text = content || commentInputs[shoutoutId];
    if (!text?.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/shoutouts/${shoutoutId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: text, parent_id: parentId })
      });

      if (response.ok) {
        // Refresh feed to show new comment (or optimistic update)
        fetchShoutouts();
        if (!parentId) {
          // Only clear main input if it was a main comment
          setCommentInputs(prev => ({ ...prev, [shoutoutId]: '' }));
        }
      } else {
        console.error("Failed to post comment");
        alert("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment", error);
    }
  };

  const handleUpdateComment = async (commentId, newContent) => {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newContent })
      });

      if (response.ok) {
        fetchShoutouts();
      } else {
        alert("Failed to update comment");
      }
    } catch (error) {
      console.error("Error updating comment", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 204) {
        fetchShoutouts();
      } else {
        alert("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shout-out?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/shoutouts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 204) {
        setShoutouts(shoutouts.filter(shoutout => shoutout.id !== id));
      } else {
        alert("Failed to delete shout-out");
      }
    } catch (error) {
      console.error("Error deleting shout-out:", error);
      alert("Error deleting shout-out");
    }
  };

  return (
    <div className="">
      {/* Header Card */}
      {/* Header Card */}
      {/* Header Card */}
      {/* Header Card */}
      {/* Header Card */}
      {/* Header Card */}
      {/* Header Card */}
      <div className="bg-white pt-3 px-6 pb-6 shadow-md rounded-lg mb-8 flex flex-col items-start gap-4">
        <div className="flex justify-between w-full items-center">
          <h2 className="text-xl font-bold text-green-900 whitespace-nowrap">(っ◔◡◔)っ ♥ 𝓡𝓮𝓬𝓮𝓷𝓽 𝓢𝓱𝓸𝓾𝓽𝓸𝓾𝓽 ♥</h2>
          <button
            onClick={() => setFilters({ department: '', sender_id: '', date_start: '', date_end: '' })}
            className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition font-semibold"
          >
            Clear Filters
          </button>
        </div>
        <div className="flex flex-row flex-nowrap gap-4 w-full">
          <input
            type="text"
            name="department"
            placeholder="Filter by Department..."
            value={filters.department}
            onChange={handleFilterChange}
            className="flex-1 min-w-0 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black placeholder-gray-900"
          />
          <select
            name="sender_id"
            value={filters.sender_id}
            onChange={handleFilterChange}
            className="flex-1 min-w-0 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
          >
            <option value="">Filter by Sender...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date_start"
            value={filters.date_start}
            onChange={handleFilterChange}
            className="flex-1 min-w-0 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
            >
              <option value="latest">New to Old</option>
              <option value="oldest">Old to New</option>
              <option value="most_liked">Most Liked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spacer to ensure separation */}
      <div className="h-3 w-full"></div>

      {/* Feed Items */}
      <div className="space-y-10 pt-6">
        {shoutouts.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-500">No shout-outs to display.</p>
          </div>
        ) : (
          shoutouts.map((shoutout) => (
            <div key={shoutout.id} className="bg-white border border-gray-100 rounded-lg p-6 shadow-lg hover:shadow-xl transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden">
                    {shoutout.sender.profile_image_url ? (
                      <img
                        src={`${API_BASE_URL}${shoutout.sender.profile_image_url}`}
                        alt={shoutout.sender.name}
                        className="w-full h-full object-cover cursor-zoom-in"
                        onClick={() => setSelectedImage(`${API_BASE_URL}${shoutout.sender.profile_image_url}`)}
                      />
                    ) : (
                      shoutout.sender.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {shoutout.sender.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold">{shoutout.sender.department}</p>
                    {shoutout.location && (
                      <p className="text-xs text-blue-500 font-semibold flex items-center gap-1">📍 {shoutout.location}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {new Date(shoutout.created_at + (shoutout.created_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString()}
                  </span>
                  {currentUser && (
                    <div className="flex gap-2 ml-2">
                      {currentUser.id === shoutout.sender.id && (
                        <button
                          onClick={() => handleEditClick(shoutout)}
                          className="flex items-center gap-1 text-blue-600 hover:text-yellow-600 transition-colors"
                          title="Edit Shout-Out"
                        >
                          <span className="text-sm font-medium">Edit</span>
                          <FaPencilAlt className="text-sm" />
                        </button>
                      )}
                      {(currentUser.id === shoutout.sender.id || currentUser.role === 'admin') && (
                        <button
                          onClick={() => handleDelete(shoutout.id)}
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 active:text-red-900 transition-colors"
                          title="Delete Shout-Out"
                        >
                          <span className="text-sm font-medium">Delete</span>
                          <FaTrash className="text-sm" />
                        </button>
                      )}
                    </div>
                  )}
                  {/* Report Button for others */}
                  {currentUser && currentUser.id !== shoutout.sender.id && (
                    <button
                      onClick={() => handleReportClick(shoutout.id)}
                      className="text-gray-400 hover:text-red-500 ml-2"
                      title="Report Content"
                    >
                      <FaFlag />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs text-gray-400 self-center mr-1">To:</span>
                {users.length > 0 && shoutout.recipients.length === users.length ? (
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                    @Everyone
                  </span>
                ) : (
                  shoutout.recipients.map((recipientItem) => (
                    <span key={recipientItem.recipient.id} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                      @{recipientItem.recipient.name || recipientItem.recipient.id}
                    </span>
                  ))
                )}
              </div>

              {editingId === shoutout.id ? (
                <div className="mb-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-black"
                    rows="3"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleUpdate(shoutout.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Save</button>
                    <button onClick={() => setEditingId(null)} className="bg-gray-300 text-black px-3 py-1 rounded text-sm hover:bg-gray-400">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 mb-2 text-base leading-relaxed">
                  {shoutout.message}
                </p>
              )}

              {shoutout.image_url && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-100">
                  <img
                    src={`${API_BASE_URL}${shoutout.image_url}`}
                    alt="Shout-out attachment"
                    className="w-full h-auto object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(`${API_BASE_URL}${shoutout.image_url}`)}
                  />
                </div>
              )}

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  {/* Like Button */}
                  <button
                    onClick={() => handleReaction(shoutout.id, 'like')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${shoutout.reactions && currentUser && shoutout.reactions.some(r => r.user_id === currentUser.id && r.type === 'like')
                      ? "bg-red-50 text-red-500"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-red-400"
                      }`}
                    title="Like"
                  >
                    <FaHeart className={shoutout.reactions && currentUser && shoutout.reactions.some(r => r.user_id === currentUser.id && r.type === 'like') ? "text-red-500" : ""} />
                    <span className="font-medium text-sm">{shoutout.reactions ? shoutout.reactions.filter(r => r.type === 'like').length : 0}</span>
                  </button>

                  {/* Clap Button */}
                  <button
                    onClick={() => handleReaction(shoutout.id, 'clap')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${shoutout.reactions && currentUser && shoutout.reactions.some(r => r.user_id === currentUser.id && r.type === 'clap')
                      ? "bg-yellow-50 text-yellow-600"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-yellow-500"
                      }`}
                    title="Clap"
                  >
                    <FaHandsClapping className={shoutout.reactions && currentUser && shoutout.reactions.some(r => r.user_id === currentUser.id && r.type === 'clap') ? "text-yellow-600" : ""} />
                    <span className="font-medium text-sm">{shoutout.reactions ? shoutout.reactions.filter(r => r.type === 'clap').length : 0}</span>
                  </button>

                  {/* Laugh Button */}
                  <button
                    onClick={() => handleReaction(shoutout.id, 'laughing')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${shoutout.reactions && currentUser && shoutout.reactions.some(r => r.user_id === currentUser.id && r.type === 'laughing')
                      ? "bg-pink-50 text-pink-500"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-pink-400"
                      }`}
                    title="Laugh"
                  >
                    <FaLaugh className={shoutout.reactions && currentUser && shoutout.reactions.some(r => r.user_id === currentUser.id && r.type === 'laughing') ? "text-pink-500" : "text-lg"} />
                    <span className="font-medium text-sm">{shoutout.reactions ? shoutout.reactions.filter(r => r.type === 'laughing').length : 0}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <div
                  className="flex justify-between items-center cursor-pointer mb-3"
                  onClick={() => toggleComments(shoutout.id)}
                >
                  <h4 className="text-sm font-bold text-green-900">Comments</h4>
                  <button className="text-gray-500 hover:text-gray-700">
                    {visibleComments[shoutout.id] ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>

                {visibleComments[shoutout.id] && (
                  <div className="space-y-4">
                    {/* List Comments */}
                    <div className="space-y-4 mb-6">
                      {shoutout.comments && organizeComments(shoutout.comments).map(comment => (
                        <div key={comment.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                          <CommentItem
                            comment={comment}
                            shoutoutId={shoutout.id}
                            onReply={handlePostComment}
                            onUpdate={handleUpdateComment}
                            onDelete={handleDeleteComment}
                            onReport={(commentId) => handleReportClick(commentId, 'comment')}
                            currentUser={currentUser}
                          />
                        </div>
                      ))}
                      {(!shoutout.comments || shoutout.comments.length === 0) && (
                        <p className="text-sm text-gray-400 italic py-4 text-center bg-white rounded-lg border border-dashed border-gray-200">
                          No comments yet. Be the first to share your thoughts!
                        </p>
                      )}
                    </div>

                    {/* Add Comment */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        className="flex-1 min-w-0 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-black"
                        value={commentInputs[shoutout.id] || ''}
                        onChange={(e) => handleCommentChange(shoutout.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handlePostComment(shoutout.id);
                        }}
                      />
                      <button
                        onClick={() => handlePostComment(shoutout.id)}
                        disabled={!commentInputs[shoutout.id]?.trim()}
                        className="bg-green-900 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center justify-center hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap shadow-sm transition-all"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Modal */}
      {
        selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4" onClick={() => setSelectedImage(null)}>
            <div className="relative max-w-4xl max-h-full">
              <img
                src={selectedImage}
                alt="Full size view"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
              <button
                className="absolute top-2 right-2 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2"
                onClick={() => setSelectedImage(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )
      }
      {/* Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.shoutout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Edit Shout-Out</h3>
            <p className="text-gray-700 mb-4">
              Do you want to edit this shout-out?
              <br />
              <span className="text-sm font-semibold text-blue-600 mt-2 block">
                Remaining edits: {2 - confirmModal.shoutout.edit_count}
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, shoutout: null })}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                id="modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
                id="modal-yes-btn"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Report Content</h3>
            <p className="text-xs text-gray-500 mb-4">Please tell us why you are reporting this shoutout.</p>
            <textarea
              className="w-full border border-gray-300 rounded p-2 text-sm text-black mb-4 focus:ring-2 focus:ring-red-500 outline-none"
              rows="3"
              placeholder="Reason for reporting..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setReportModal({ isOpen: false, shoutoutId: null })}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-sm text-sm font-bold"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div >

  );
};

export default ShoutOutFeed;
