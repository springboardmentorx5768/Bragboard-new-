import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCode, FaServer, FaDatabase, FaLayerGroup, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import InteractiveBackground from './InteractiveBackground';
import './ProfilePage.css';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100 }
    }
};

const AboutPage = () => {
    const navigate = useNavigate();

    return (
        <div className="profile-page-container text-gray-800 font-sans">
            <InteractiveBackground />

            {/* Navbar / Back Button */}

            <nav className="absolute top-0 w-full z-20 p-6 flex justify-between items-center bg-transparent">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/success')}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium text-lg bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm"
                >
                    <FaArrowLeft />
                    <span>Back to Board</span>
                </motion.button>
            </nav>

            {/* Scrollable Content Container */}
            <div className="w-full h-screen overflow-y-auto custom-scrollbar relative z-10 pt-24 pb-12">
                <motion.div
                    variants={containerVariants}
                    animate="visible"
                    // Removed initial="hidden" to ensure visibility by default, animation will still run if mounted freshly
                    className="w-full max-w-[95%] mx-auto px-4 lg:px-12"
                >

                    {/* Header Section - Top Center */}
                    <motion.div variants={itemVariants} className="flex flex-col items-center text-center mb-16">
                        <h1 className="text-5xl font-extrabold text-white drop-shadow-md mb-4">
                            About BragBoard
                        </h1>
                        <p className="text-xl text-white/90 max-w-3xl text-center drop-shadow-sm">
                            An internal employee recognition wall to celebrate wins and promote a culture of appreciation.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 mb-12 items-start">

                        {/* Developer Profile - Left Column */}
                        <motion.div variants={itemVariants} className="flex flex-col items-center text-center lg:sticky lg:top-8">
                            <div
                                className="relative w-96 h-auto mb-6 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl ring-4 ring-white/10 floating-animation"
                            >
                                <img
                                    src="/IMG_20251108_160214967.jpg"
                                    alt="Gourab Gorai"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                            <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-md">Gourab Gorai</h2>
                            <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-6 backdrop-blur-sm border border-white/20 shadow-sm">
                                LEAD DEVELOPER
                            </span>
                            <p className="text-white/90 italic text-lg leading-relaxed drop-shadow-sm max-w-md">
                                "Building platforms that connect people and celebrate success through modern web technologies."
                            </p>
                        </motion.div>

                        {/* Project Info & Details - Right Column */}
                        <div className="space-y-8">
                            {/* Tech Stack */}
                            <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                                    <FaCode className="text-blue-500" />
                                    Tech Stack
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                        <span className="font-semibold text-blue-700">React.js</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-teal-50 rounded-lg">
                                        <span className="font-semibold text-teal-700">Tailwind CSS</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                                        <FaServer className="text-green-600" size={12} />
                                        <span className="font-semibold text-green-700">FastAPI</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
                                        <FaDatabase className="text-indigo-600" size={12} />
                                        <span className="font-semibold text-indigo-700">PostgreSQL</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Design Philosophy */}
                            <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                                    <FaLayerGroup className="text-purple-500" />
                                    Design Philosophy
                                </h3>
                                <ul className="list-disc list-inside text-gray-600 space-y-2">
                                    <li><strong>Glassmorphism:</strong> Using backdrop blurs and semi-transparent layers for a modern feel.</li>
                                    <li><strong>Interactivity:</strong> Framer Motion for smooth entrances and hover effects.</li>
                                    <li><strong>Responsiveness:</strong> Mobile-first approach using Tailwind CSS.</li>
                                </ul>
                            </motion.div>

                            {/* Features Section - Moved to Right Column */}
                            <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/50">
                                <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">Key Features</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-start gap-4">
                                        <div className="mt-1 text-blue-500"><FaUser /></div>
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">Shout-outs</h4>
                                            <p className="text-gray-600 text-sm">Send appreciations to teammates with tagging capabilities.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-start gap-4">
                                        <div className="mt-1 text-purple-500"><FaLayerGroup /></div>
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">Live Feed</h4>
                                            <p className="text-gray-600 text-sm">Real-time updates of recognitions across the company.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-start gap-4">
                                        <div className="mt-1 text-pink-500"><FaCode /></div>
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">Reactions</h4>
                                            <p className="text-gray-600 text-sm">Interactive likes, claps, and stars to engage with posts.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Footer */}
                    <motion.div variants={itemVariants} className="text-center text-white/80 text-sm pb-8 font-medium">
                        &copy; {new Date().getFullYear()} BragBoard. Developed by Gourab Gorai.
                    </motion.div>

                </motion.div>
            </div >
        </div >
    );
};

export default AboutPage;

