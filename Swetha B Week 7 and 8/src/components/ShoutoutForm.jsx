import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ShoutoutForm = ({ onShoutoutCreated }) => {
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleAddRecipient = (e) => {
    const userId = parseInt(e.target.value);
    if (!userId) return;

    const userToAdd = users.find((u) => u.id === userId);
    if (userToAdd && !selectedRecipients.find((u) => u.id === userId)) {
      setSelectedRecipients([...selectedRecipients, userToAdd]);
    }
    e.target.value = ''; // Reset select
  };

  const handleRemoveRecipient = (userId) => {
    setSelectedRecipients(selectedRecipients.filter((u) => u.id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }
    if (selectedRecipients.length === 0) {
      setError('Please tag at least one colleague.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      message: message,
      recipients: selectedRecipients.map((u) => u.id),
      // image: null // Optional for now
    };

    try {
      await api.post('/shoutouts/', payload);
      setMessage('');
      setSelectedRecipients([]);
      if (onShoutoutCreated) onShoutoutCreated();
    } catch (err) {
      console.error('Failed to create shoutout:', err);
      setError('Failed to post shoutout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Give a Shoutout! 🎉</h3>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Who was awesome today and why?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tag Colleagues</label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleAddRecipient}
            defaultValue=""
          >
            <option value="" disabled>Select a colleague...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.department})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Recipients Chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {selectedRecipients.map((user) => (
            <div key={user.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center text-sm">
              <span className="mr-2">@{user.name}</span>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 font-bold focus:outline-none"
                onClick={() => handleRemoveRecipient(user.id)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-green-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-900 transition duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isSubmitting ? 'Posting...' : 'Post Shoutout 🚀'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShoutoutForm;
