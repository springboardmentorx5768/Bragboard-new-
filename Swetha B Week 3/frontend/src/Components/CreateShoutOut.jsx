import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8000";

export default function CreateShoutOut() {
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [recipients, setRecipients] = useState([]);

  useEffect(() => {
    axios.get(`${API}/users`).then(res => {
      setUsers(res.data);
    });
  }, []);

  const toggleUser = (id) => {
    setRecipients(prev =>
      prev.includes(id)
        ? prev.filter(u => u !== id)
        : [...prev, id]
    );
  };

  const submitShoutOut = async () => {
    await axios.post(`${API}/shoutouts`, {
      message,
      recipient_ids: recipients
    });

    alert("Shout-out sent!");
    setMessage("");
    setRecipients([]);
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
