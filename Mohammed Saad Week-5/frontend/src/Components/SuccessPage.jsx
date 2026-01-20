import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaGlobeAmericas } from 'react-icons/fa';

const SuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col relative overflow-hidden">
      
      {/* BACKGROUND TEXT EFFECT */}
      <h1 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
        text-8xl md:text-[10rem] lg:text-[14rem] font-extrabold text-white opacity-10 
        whitespace-nowrap pointer-events-none tracking-widest uppercase">
        BRAGBOARD
      </h1>

      {/* NAVIGATION BAR */}
      <nav className="bg-white bg-opacity-10 shadow-lg p-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-white tracking-wider">BragBoard</h1>
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-white hover:text-green-300 transition-colors px-3 py-1 rounded-md border border-white"
        >
          <FaUserCircle size={24} />
          <span>Profile</span>
        </button>
      </nav>

      {/* MAIN CONTENT BOX */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 z-10">
        <div className="bg-white p-10 rounded-xl shadow-2xl text-center max-w-lg w-full">
          
          <h2 className="text-4xl font-extrabold text-indigo-700 mb-3">
            Welcome to BragBoard!
          </h2>
          
          <p className="text-gray-700 italic mb-8 text-lg">
            "Your success is contagious. Share your triumphs and inspire the team."
          </p>
          
          <p className="text-gray-500 mb-6 text-sm font-semibold">
            Login Successful! Choose where to go next:
          </p>

          <div className="flex flex-col gap-4">
            {/* GO TO PROFILE BUTTON */}
            <button
              onClick={() => navigate('/profile')}
              className="w-full bg-green-500 text-white font-bold tracking-wide 
                         px-8 py-3 rounded-full hover:bg-green-600 transition-all shadow-md 
                         transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <FaUserCircle /> Go to My Profile
            </button>

            {/* VIEW GLOBAL FEED BUTTON */}
            <button
              onClick={() => navigate('/feed')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold 
                         tracking-wide px-8 py-3 rounded-full hover:from-blue-700 hover:to-indigo-700 
                         transition-all shadow-md transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <FaGlobeAmericas /> View Public Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;