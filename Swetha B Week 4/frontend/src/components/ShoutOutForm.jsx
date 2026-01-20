import React, { useState, useEffect } from 'react';

const ShoutOutForm = () => {
    const token = localStorage.getItem('access_token');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
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
            const formData = new FormData();
            formData.append('message', message);
            // Append each recipient_id individually
            selectedRecipients.forEach(id => {
                formData.append('recipient_ids', id);
            });
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            const response = await fetch('http://localhost:8000/shoutouts/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                setStatus('Shout-out sent!');
                setMessage('');
                setSelectedRecipients([]);
                setSelectedFile(null);
                // Clear file input manually if needed, but since it's uncontrolled mostly or we can use ref
                document.getElementById('file-upload').value = "";
            } else {
                const errorData = await response.json();
                setStatus(errorData.detail || 'Failed to send shout-out.');
            }
        } catch (error) {
            console.error(error);
            setStatus('Error sending shout-out.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold text-green-900">

                ♥ 𝙶𝚒𝚟𝚎 𝚊 𝚂𝚑𝚘𝚞𝚝𝚘𝚞𝚝 ♥  !  ➣
            </h2>
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
                        value={users.length > 0 && selectedRecipients.length === users.length ? ['everyone', ...selectedRecipients] : selectedRecipients}
                        onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                            const isAllSelected = users.length > 0 && selectedRecipients.length === users.length;

                            if (selectedOptions.includes('everyone')) {
                                if (isAllSelected) {
                                    // If already all selected, and everyone is still there, check if we lost someone
                                    if (selectedOptions.length < users.length + 1) {
                                        // Someone was deselected
                                        setSelectedRecipients(selectedOptions.filter(v => v !== 'everyone'));
                                    } else {
                                        // "Everyone" clicked again or no change
                                        setSelectedRecipients(users.map(u => u.id));
                                    }
                                } else {
                                    // Select All
                                    setSelectedRecipients(users.map(u => u.id));
                                }
                            } else {
                                // 'everyone' is NOT in selectedOptions
                                if (isAllSelected) {
                                    // It WAS selected, now it's gone -> Deselect All
                                    setSelectedRecipients([]);
                                } else {
                                    // Normal selection
                                    setSelectedRecipients(selectedOptions);
                                }
                            }
                        }}
                    >
                        <option value="everyone">
                            Select Everyone
                        </option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name} ({user.department})</option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2 text-green-800 hover:text-blue-900 transition-colors font-bold">
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M43.246 466.142c-58.43-60.289-56.311-157.5 5.762-215.154l179.914-166.742c38.006-35.337 96.65-35.597 135.056-.477 37.957 34.697 38.36 91.173 1.481 126.31l-149.61 138.643c-14.054 13.023-37.1 13.076-51.213 0-14.114-13.078-14.115-34.286-.002-47.362l128.877-119.429c8.583-7.956 8.586-20.852.008-28.809-8.577-7.955-22.486-7.957-31.071-.002L133.57 262.548c-42.348 39.243-42.345 102.868.002 142.11 42.347 39.24 110.999 39.241 153.345.001l149.611-138.644c68.802-63.754 69.544-169.505 1.666-233.911C370.832-29.358 262.152-29.373 194.792 31.834L14.877 198.577c-65.034 60.101-90.17 149.805-49.886 206.155 38.991 54.549 116.096 73.189 176.196 17.5l140.73-130.407c8.584-7.956 8.586-20.852.008-28.809-8.577-7.955-22.486-7.956-31.071-.001L109.91 393.428c-30.82 28.567-54.664 10.975-66.664-27.286z"></path></svg>
                        𝘼𝙩𝙩𝙖𝙘𝙝 𝙋𝙝𝙤𝙩𝙤/𝙑𝙞𝙙𝙚𝙤
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        accept="image/*,video/*"
                    />
                    {selectedFile && <p className="text-sm text-gray-500 mt-1">Selected: {selectedFile.name}</p>}
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-900 text-white font-bold py-2 px-4 rounded border-4 border-red-500 hover:bg-orange-700 hover:border-red-600 transition-colors duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                    𝙋𝙤𝙨𝙩 𝙎𝙝𝙤𝙪𝙩𝙤𝙪𝙩 !
                </button>
            </form>
        </div>
    );
};

export default ShoutOutForm;
