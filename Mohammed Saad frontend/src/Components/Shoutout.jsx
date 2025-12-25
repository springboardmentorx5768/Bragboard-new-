import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { FaBullhorn, FaUserTag, FaPaperPlane, FaArrowLeft } from "react-icons/fa";

// Updated to port 9000 to match your running backend
const API_BASE = "http://127.0.0.1:9000"; 

export default function ShoutoutForm() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]); 
    const [formData, setFormData] = useState({
        recipient_ids: [], // Changed to an array for multiple tags
        message: ''
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Fetching from the public route we updated in shoutouts.py
                const res = await fetch(`${API_BASE}/shoutouts/users`); 
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                } else {
                    console.error("Failed to fetch users. Status:", res.status);
                }
            } catch (err) {
                console.error("Connection error while fetching users:", err);
            }
        };
        fetchUsers();
    }, []);

    // New handler to process multiple selections from the dropdown
    const handleSelectChange = (e) => {
        const selectedValues = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData({ ...formData, recipient_ids: selectedValues });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            setMessage("❌ You must be logged in to send a shout-out.");
            return;
        }

        if (formData.recipient_ids.length === 0) {
            setMessage("❌ Please select at least one teammate.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/shoutouts/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setMessage(`🎉 Shout-out sent successfully to ${formData.recipient_ids.length} teammates!`);
                setTimeout(() => navigate('/profile'), 1500);
            } else {
                const errorData = await res.json();
                setMessage(`❌ Error: ${errorData.detail || "Could not send shout-out"}`);
            }
        } catch (err) {
            console.error("Error sending shout-out:", err);
            setMessage("❌ Server connection failed.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 px-6 py-10 flex flex-col items-center">
            <div className="w-full max-w-lg">
                <button onClick={() => navigate('/profile')} className="text-white hover:text-cyan-400 flex items-center gap-2 mb-6 font-bold">
                    <FaArrowLeft /> Back
                </button>

                <h1 className="text-4xl font-extrabold text-center mb-10 text-white tracking-wider drop-shadow-lg">
                    <FaBullhorn className="inline-block mr-3 text-yellow-400" /> GIVE A SHOUT-OUT
                </h1>

                <motion.form 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onSubmit={handleSubmit}
                    className="bg-white p-10 rounded-[2rem] shadow-2xl space-y-6"
                >
                    {message && (
                        <div className={`p-3 rounded-lg text-center font-bold ${message.includes('🎉') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message}
                        </div>
                    )}

                    {/* RECIPIENT TAGGING DROPDOWN (MULTI-SELECT) */}
                    <div>
                        <label className="block text-gray-800 font-black mb-1 flex items-center gap-2">
                            <FaUserTag className="text-cyan-600" /> Tag Teammates
                        </label>
                        <p className="text-xs text-gray-500 mb-2 font-bold italic">
                            Hold Ctrl (Windows) or Cmd (Mac) to select multiple
                        </p>
                        <select 
                            multiple
                            required
                            value={formData.recipient_ids}
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-cyan-100 outline-none font-semibold text-gray-900 h-40 overflow-y-auto"
                            onChange={handleSelectChange}
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id} className="p-2 border-b border-gray-50">
                                    {user.name} ({user.department})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* SHOUT-OUT MESSAGE */}
                    <div>
                        <label className="block text-gray-800 font-black mb-2">Your Message</label>
                        <textarea 
                            required
                            rows="4"
                            value={formData.message}
                            placeholder="Why are they awesome?"
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-100 outline-none font-semibold text-gray-900"
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                        />
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-black text-xl shadow-xl flex justify-center items-center gap-3"
                    >
                        <FaPaperPlane /> SEND SHOUT-OUT
                    </motion.button>
                </motion.form>
            </div>
        </div>
    );
}