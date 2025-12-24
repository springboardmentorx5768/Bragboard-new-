import React, { useState, useEffect } from 'react';

const ShoutOutForm = () => {
    const token = localStorage.getItem('access_token');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            if (!token) {
                return;
            }
            try {
                const response = await fetch('http://localhost:8000/users/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                } else {
                    console.error("Failed to fetch users: " + response.statusText);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };

        if (token) fetchUsers();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8000/shoutouts/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message,
                    recipient_ids: selectedRecipients.map(id => parseInt(id))
                })
            });

            if (response.ok) {
                setStatus('Shout-out sent!');
                setMessage('');
                setSelectedRecipients([]);
            } else {
                setStatus('Failed to send shout-out.');
            }
        } catch (error) {
            setStatus('Error sending shout-out.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Give a Shout-Out!</h2>
            {status && <p className="mb-2 text-blue-600">{status}</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Message</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        rows="3"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Tag Teammates (Ctrl+Click to select multiple)</label>
                    <select
                        multiple
                        className="w-full p-2 border rounded h-32"
                        value={selectedRecipients}
                        onChange={(e) => setSelectedRecipients(Array.from(e.target.selectedOptions, option => option.value))}
                    >
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name} ({user.department})</option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                    Send Shout-Out
                </button>
            </form>
        </div>
    );
};

export default ShoutOutForm;
