import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrophy } from "react-icons/fa";
import ShoutoutFeed from './ShoutoutFeed'; // Reusing your component

export default function FeedPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 px-6 py-10 flex justify-center">
            <div className="w-full max-w-2xl mt-12 pb-20">
                {/* Back Button */}
                <button 
                    onClick={() => navigate('/profile')} 
                    className="text-white hover:text-cyan-400 flex items-center gap-2 mb-8 font-bold transition-colors"
                >
                    <FaArrowLeft /> Back to Profile
                </button>

                <h1 className="text-5xl font-extrabold text-center mb-16 text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                    <FaTrophy className="inline-block text-yellow-300 mr-4" /> GLOBAL FEED
                </h1>

                {/* Reusing your ShoutoutFeed here */}
                <ShoutoutFeed />
            </div>
        </div>
    );
}