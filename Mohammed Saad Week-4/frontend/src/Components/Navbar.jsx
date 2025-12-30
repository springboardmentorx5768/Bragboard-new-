import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaUser, FaPencilAlt, FaChartBar, FaSignOutAlt } from "react-icons/fa";

export default function Navbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/');
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                {/* LEFT: Brand */}
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/success')}>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                        BB
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-800">BragBoard</div>
                        <div className="text-xs text-gray-500">Employee Recognition</div>
                    </div>
                </div>

                {/* CENTER: Nav buttons (desktop) */}
                <nav className="hidden md:flex items-center gap-6">
                    <button
                        onClick={() => navigate("/profile")}
                        className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
                    >
                        <FaUser /> Profile
                    </button>

                    <button
                        onClick={() => navigate("/profile/edit")}
                        className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
                    >
                        <FaPencilAlt /> Edit
                    </button>

                </nav>

                {/* RIGHT: small actions */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
                        title="Logout"
                    >
                        <FaSignOutAlt />
                    </button>

                    {/* Mobile nav icon (optional) */}
                    <button
                        className="md:hidden flex items-center px-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
                        onClick={() => alert("Mobile menu (not implemented)")}
                    >
                        <FaBars />
                    </button>
                </div>
            </div>
        </header>
    );
}
