import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaTrash } from "react-icons/fa";

const ShoutOutFeed = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    department: '',
    sender_id: '',
    date_start: '',
    date_end: '',
  });
  const [shoutouts, setShoutouts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { token } = useAuth();

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/users/', {
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
      const response = await fetch('http://localhost:8000/users/me', {
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
      let url = 'http://localhost:8000/shoutouts/?';
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.sender_id) params.append('sender_id', filters.sender_id);
      if (filters.date_start) params.append('date_start', new Date(filters.date_start).toISOString());
      if (filters.date_end) params.append('date_end', new Date(filters.date_end).toISOString());

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
  }, [filters, token]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shout-out?")) return;

    try {
      const response = await fetch(`http://localhost:8000/shoutouts/${id}`, {
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
        <h2 className="text-xl font-bold text-green-900 whitespace-nowrap">(っ◔◡◔)っ ♥ 𝓡𝓮𝓬𝓮𝓷𝓽 𝓢𝓱𝓸𝓾𝓽𝓸𝓾𝓽 ♥</h2>
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
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                    {shoutout.sender.name ? shoutout.sender.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{shoutout.sender.name || `User ${shoutout.sender.id}`}</p>
                    <p className="text-sm text-gray-500 font-medium">{shoutout.sender.department || 'General'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {new Date(shoutout.created_at).toLocaleDateString()}
                  </span>
                  {currentUser && currentUser.id === shoutout.sender.id && (
                    <button
                      onClick={() => handleDelete(shoutout.id)}
                      className="flex items-center gap-1 ml-2 text-green-600 hover:text-green-700 active:text-red-900 transition-colors"
                      title="Delete Shout-Out"
                    >
                      <span className="text-sm font-medium">Delete</span>
                      <FaTrash className="text-sm" />
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

              <p className="text-gray-700 mb-2 text-base leading-relaxed">{shoutout.message}</p>

              {shoutout.image_url && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-100">
                  <img
                    src={`http://localhost:8000${shoutout.image_url}`}
                    alt="Shout-out attachment"
                    className="w-full h-auto object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(`http://localhost:8000${shoutout.image_url}`)}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
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
      )}
    </div>
  );
};

export default ShoutOutFeed;
