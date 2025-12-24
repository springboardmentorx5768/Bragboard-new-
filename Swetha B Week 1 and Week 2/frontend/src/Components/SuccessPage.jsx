import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaPencilAlt, FaSignOutAlt } from "react-icons/fa";
import ShoutOutForm from './ShoutOutForm.jsx';

const SuccessPage = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };


  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/200.jpg')" }}
    >


      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-green-900">BragBoard</h1>

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
      </nav>

      <div className="flex-1 flex flex-col justify-center items-center py-8">
        <div className="w-full max-w-2xl px-4">
          <ShoutOutForm />
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
