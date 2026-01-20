import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaUserCircle, FaPencilAlt, FaSignOutAlt } from "react-icons/fa";

export default function Navbar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  return (
    <header className="relative fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200">
  <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">

    {/* LEFT: Brand */}
    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/success')}>
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-900 to-green-400 flex items-center justify-center text-white font-bold">
        🏠︎
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-800">BragBoard</div>
        <div className="text-xs text-gray-500">Employee Recognition</div>
      </div>
    </div>

    {/* RIGHT: Nav buttons */}
    <div className="absolute top-0 right-0 flex items-center gap-4 p-3">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-green-900 hover:text-blue-900 transition-colors"
      >
        <FaUserCircle size={24} /> Profile
      </button>

      <button
        onClick={() => navigate("/profile/edit")}
        className="flex items-center gap-2 text-green-900 hover:text-yellow-700 transition-colors"
      >
        <FaPencilAlt size={21} /> Edit
      </button>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-green-900 hover:text-red-700 transition-colors"
      >
        <FaSignOutAlt size={20} /> Logout
      </button>
      

    </div>

    {/* Mobile nav icon */}
    <button
      className="md:hidden flex items-center px-2 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
      onClick={() => alert("Mobile menu (not implemented)")}
    >
      <FaBars />
    </button>

  </div>
</header>

  );
}
