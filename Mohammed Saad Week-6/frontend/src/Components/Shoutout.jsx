import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { FaBullhorn, FaUserTag, FaPaperPlane, FaArrowLeft, FaImage, FaCommentDots } from "react-icons/fa";

const API_BASE = "http://127.0.0.1:9000"; 

export default function ShoutoutForm() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]); 
    const [formData, setFormData] = useState({ recipient_ids: [], message: '' });
    const [file, setFile] = useState(null);
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`${API_BASE}/shoutouts/users`); 
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (err) {
                console.error("Connection error:", err);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');
        if (!token) return setStatusMsg("❌ Login required.");

        const data = new FormData();
        data.append('message', formData.message);
        data.append('recipient_ids', JSON.stringify(formData.recipient_ids));
        if (file) data.append('file', file);

        try {
            const res = await fetch(`${API_BASE}/shoutouts/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            if (res.ok) {
                setStatusMsg("🎉 Shout-out sent successfully!");
                setTimeout(() => navigate('/profile'), 1500);
            }
        } catch (err) {
            setStatusMsg("❌ Server connection failed.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 px-6 py-10 flex flex-col items-center">
            <div className="w-full max-w-xl">
                <button onClick={() => navigate('/profile')} className="text-white hover:text-cyan-400 flex items-center gap-2 mb-8 font-bold transition-colors">
                    <FaArrowLeft /> Back to Feed
                </button>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/95 backdrop-blur-md p-10 rounded-[2.5rem] shadow-2xl border border-white/20"
                >
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter flex justify-center items-center gap-3">
                            <FaBullhorn className="text-yellow-500 animate-bounce" /> GIVE RECOGNITION
                        </h1>
                        <p className="text-gray-500 font-medium mt-2 italic">Celebrate your teammate's hard work!</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {statusMsg && (
                            <div className="p-4 bg-indigo-50 text-indigo-700 rounded-2xl font-bold text-center border border-indigo-100 shadow-sm">
                                {statusMsg}
                            </div>
                        )}

                        {/* RECIPIENT SELECTOR */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-gray-800 font-black text-sm uppercase tracking-widest ml-1">
                                <FaUserTag className="text-cyan-600" /> Select Teammates
                            </label>
                            <div className="relative group">
                                <select 
                                    multiple 
                                    required
                                    value={formData.recipient_ids} 
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl h-48 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all text-gray-900 font-bold scrollbar-thin scrollbar-thumb-gray-300" 
                                    onChange={(e) => setFormData({...formData, recipient_ids: Array.from(e.target.selectedOptions, o => parseInt(o.value))})}
                                >
                                    {users.map(u => (
                                        <option key={u.id} value={u.id} className="p-3 border-b border-gray-50 hover:bg-cyan-50 cursor-pointer text-gray-900">
                                            {u.name} — {u.department}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-400 font-bold mt-2 ml-1 italic">
                                    TIP: Hold Ctrl (Win) or Cmd (Mac) to select multiple people
                                </p>
                            </div>
                        </div>

                        {/* MESSAGE TEXTAREA */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-gray-800 font-black text-sm uppercase tracking-widest ml-1">
                                <FaCommentDots className="text-purple-600" /> The Shout-Out
                            </label>
                            <textarea 
                                required 
                                placeholder="What did they do that was awesome?"
                                value={formData.message} 
                                className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl min-h-[120px] outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-gray-900 font-bold placeholder:text-gray-400 shadow-inner" 
                                onChange={(e) => setFormData({...formData, message: e.target.value})} 
                            />
                        </div>

                        {/* FILE UPLOAD */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-gray-800 font-black text-sm uppercase tracking-widest ml-1">
                                <FaImage className="text-green-600" /> Evidence of Greatness
                            </label>
                            <div className={`relative group border-2 border-dashed rounded-2xl p-6 transition-all ${file ? 'border-green-500 bg-green-50/30' : 'border-gray-200 hover:border-cyan-400 bg-gray-50/50'}`}>
                                <label className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full">
                                    <FaImage className={`text-3xl ${file ? 'text-green-500' : 'text-gray-400 group-hover:text-cyan-500'}`} />
                                    <span className={`font-bold text-sm ${file ? 'text-green-700' : 'text-gray-500 group-hover:text-cyan-600'}`}>
                                        {file ? `Selected: ${file.name}` : "Click to attach an image (Optional)"}
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
                                </label>
                                {file && (
                                    <button 
                                        type="button" 
                                        onClick={() => setFile(null)}
                                        className="absolute top-2 right-2 text-red-500 bg-white p-1 rounded-full shadow-sm hover:bg-red-50 border border-red-100"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:shadow-cyan-500/20 transition-all flex justify-center items-center gap-3 tracking-tighter"
                        >
                            <FaPaperPlane className="text-lg" /> SEND SHOUT-OUT
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}