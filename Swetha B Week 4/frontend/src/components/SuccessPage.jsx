import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaPencilAlt, FaSignOutAlt } from "react-icons/fa";
import ShoutOutForm from './ShoutOutForm.jsx';
import ShoutOutFeed from './ShoutOutFeed.jsx';

const SuccessPage = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };


  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/201.jpg')" }}
    >


      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-green-900">𝐁𝐫𝐚𝐠 𝐁𝐨𝐚𝐫𝐝</h1>

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

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-14">
        <div className="text-left mb-4 pb-2">
          <center><h3 className="text-2xl font-bold text-gray-100 mb-1">
            𝐖𝙚𝙡𝙘𝙤𝙢𝙚 𝙩𝙤 𝙩𝙝𝙚 𝐁𝐫𝐚𝐠 𝐁𝐨𝐚𝐫𝐝 👋<break></break>

            !!

          </h3>
            <h3 className="text-xl font-semibold text-gray-100 mb-1">
              𝐓𝐡𝐞 𝐄𝐦𝐩𝐥𝐨𝐲𝐞𝐞 𝐑𝐞𝐜𝐨𝐠𝐧𝐢𝐭𝐢𝐨𝐧 𝐖𝐚𝐥𝐥 </h3>
          </center>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center">
          {/* Left Column: Form */}
          <div className="lg:col-span-5 lg:col-start-2 space-y-6">
            <ShoutOutForm />
          </div>

          {/* Right Column: Feed */}
          <div className="lg:col-span-5">
            <ShoutOutFeed />
          </div>
        </div>
      </div>
    </div >
  );
};

export default SuccessPage;
