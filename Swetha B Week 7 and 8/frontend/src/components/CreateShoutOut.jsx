import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

import { API_BASE_URL } from '../config';

const API = API_BASE_URL;

export default function CreateShoutOut() {
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUsers(res.data);
      }).catch(err => console.error("Error fetching users:", err));
    }
  }, [token]);

  const toggleUser = (id) => {
    setRecipients(prev =>
      prev.includes(id)
        ? prev.filter(u => u !== id)
        : [...prev, id]
    );
  };

  const submitShoutOut = async () => {
    if (!token) {
      alert("You must be logged in to post a shoutout.");
      return;
    }
    try {
      await axios.post(`${API}/shoutouts`, {
        message,
        recipient_ids: recipients
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Shout-out sent!");
      setMessage("");
      setRecipients([]);
    } catch (error) {
      console.error("Error posting shoutout:", error);
      alert("Failed to send shout-out.");
    }
  };

  return (
    <div>
      <h2>Create Shout-Out</h2>

      <textarea
        placeholder="Write your shout-out..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <h4>Tag Recipients</h4>
      {users.map(user => (
        <div key={user.id}>
          <input
            type="checkbox"
            checked={recipients.includes(user.id)}
            onChange={() => toggleUser(user.id)}
          />
          {user.name}
        </div>
      ))}

      <button onClick={submitShoutOut}>
        Send Shout-Out
      </button>
    </div>
  );
}
