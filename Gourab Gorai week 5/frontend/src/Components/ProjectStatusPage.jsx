import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserCircle, FaSignOutAlt, FaRocket, FaCheckCircle, FaHourglassHalf, FaArrowLeft, FaInfoCircle, FaEdit, FaUndo } from 'react-icons/fa';
import InteractiveBackground from './InteractiveBackground';
import './ProfilePage.css';

import API_BASE from "../config";

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

const ProjectStatusPage = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [completedWeeks, setCompletedWeeks] = useState(0);

    const weekData = [
        {
            id: 1,
            title: "Week 1: Foundations & Auth",
            items: [
                "Project Setup & Architecture",
                "Database Configuration",
                "User Registration Endpoint",
                "Login & JWT Implementation"
            ]
        },
        {
            id: 2,
            title: "Week 2: User Profiles & UI",
            items: [
                "User Profile Management",
                "Frontend Routing Structure",
                "Authentication UI Pages",
                "Responsive Layout Implementation"
            ]
        },
        {
            id: 3,
            title: "Week 3: Core Shoutout Logic",
            items: [
                "Shoutout Database Models",
                "Create Shoutout API",
                "Feed Retrieval Endpoints",
                "Department Filtering Backend"
            ]
        },
        {
            id: 4,
            title: "Week 4: Feed UI & Interaction",
            items: [
                "Shoutout Creation Form",
                "Interactive Feed Cards",
                "Department Filtering UI",
                "Recipient Tagging System"
            ]
        },
        {
            id: 5,
            title: "Week 5: Reaction System",
            items: [
                "Reaction Database Models",
                "Reaction API Endpoints",
                "Frontend Reaction Components",
                "Real-time Counter Updates"
            ]
        },
        {
            id: 6,
            title: "Week 6: Commenting System",
            items: [
                "Comment Database Models",
                "Comment API Implementation",
                "Comment UI & Integration",
                "Comment Moderation Basics"
            ]
        },
        {
            id: 7,
            title: "Week 7: Admin Backend",
            items: [
                "Admin Middleware & Role Checks",
                "Analytics Data Aggregation",
                "Global Settings API",
                "User Management Backend"
            ]
        },
        {
            id: 8,
            title: "Week 8: Admin Dashboard",
            items: [
                "Admin Dashboard UI",
                "Analytics Visualization",
                "Content Moderation Tools",
                "System Configuration Panel"
            ]
        }
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            const token = sessionStorage.getItem('access_token');
            if (token) {
                try {
                    // Fetch User Data
                    const userRes = await fetch(`${API_BASE}/users/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (userRes.ok) {
                        const data = await userRes.json();
                        setUserName(data.name);
                        setUserRole(data.role);
                    }

                    // Fetch Settings
                    const settingsRes = await fetch(`${API_BASE}/shoutouts/settings`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (settingsRes.ok) {
                        const data = await settingsRes.json();
                        setCompletedWeeks(parseInt(data.completed_weeks || 0));
                    }

                } catch (e) {
                    console.error(e);
                }
            }
        };
        fetchUserData();
    }, []);

    const updateStatus = async (weeks) => {
        const token = sessionStorage.getItem('access_token');
        if (!token) return;

        try {
            const formData = new FormData();
            formData.append('weeks', weeks);

            const res = await fetch(`${API_BASE}/shoutouts/settings/completed_weeks`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                setCompletedWeeks(weeks);
            } else {
                alert("Failed to update status");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating status");
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        navigate('/');
    };

    return (
        <div className="profile-page-container text-gray-800 font-sans">
            <InteractiveBackground />

            {/* Navbar */}
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

                <div className="flex items-center gap-6">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/about')}
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium text-lg bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm"
                    >
                        <FaInfoCircle />
                        <span className="hidden sm:inline">About</span>
                    </motion.button>
                </div>
            </nav>

            {/* Scrollable Content Container */}
            <div className="w-full h-screen overflow-y-auto custom-scrollbar relative z-10 pt-24 pb-12 flex flex-col items-center">
                <motion.div
                    variants={containerVariants}
                    animate="visible"
                    className="w-full max-w-5xl px-4 lg:px-12 my-auto"
                >
                    {/* Header Section */}
                    <motion.div variants={itemVariants} className="flex flex-col items-center text-center mb-16">
                        <h1 className="text-5xl font-extrabold text-white drop-shadow-md mb-4">
                            Project Status & Timeline
                        </h1>
                        <p className="text-xl text-white/90 max-w-3xl text-center drop-shadow-sm">
                            Tracking our weekly progress against the 8-week development plan.
                        </p>
                    </motion.div>

                    {/* Timeline Grid */}
                    <div className="space-y-8 mb-12">
                        {weekData.map((week, index) => {
                            const isCompleted = index < completedWeeks;
                            const isNextPending = index === completedWeeks;
                            const isLastCompleted = index === completedWeeks - 1;

                            return (
                                <motion.div
                                    variants={itemVariants}
                                    key={week.id}
                                    className={`relative rounded-2xl p-6 transition-all group hover:shadow-lg backdrop-blur-md border border-white/50 ${isCompleted
                                        ? 'bg-white/80'
                                        : 'bg-white/60 opacity-90'
                                        }`}
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 relative z-10">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-bold shadow-md ${isCompleted
                                                ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-700'
                                                : 'bg-gray-200 text-gray-500'
                                                }`}>
                                                {isCompleted ? <FaCheckCircle /> : <FaHourglassHalf />}
                                            </div>
                                            <div>
                                                <h3 className={`text-2xl font-bold ${isCompleted ? 'text-gray-800' : 'text-gray-600'
                                                    }`}>
                                                    {week.title}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider shadow-sm uppercase ${isCompleted
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {isCompleted ? 'COMPLETED' : 'PENDING'}
                                            </span>

                                            {/* Admin Controls */}
                                            {userRole === 'admin' && (
                                                <>
                                                    {isNextPending && (
                                                        <button
                                                            onClick={() => updateStatus(index + 1)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                                        >
                                                            <FaEdit /> Mark Complete
                                                        </button>
                                                    )}
                                                    {isLastCompleted && (
                                                        <button
                                                            onClick={() => updateStatus(index)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-bold hover:bg-gray-600 transition-colors shadow-sm"
                                                        >
                                                            <FaUndo /> Undo
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <ul className="space-y-3 pl-16">
                                        {week.items.map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                                                <span className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-blue-500' : 'bg-gray-400'
                                                    }`} />
                                                <span className={!isCompleted ? 'text-gray-500' : ''}>
                                                    {item}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <motion.div variants={itemVariants} className="text-center text-white/80 text-sm pb-8 font-medium">
                        &copy; {new Date().getFullYear()} BragBoard. Developed by Gourab Gorai.
                    </motion.div>

                </motion.div>
            </div>
        </div>
    );
};

export default ProjectStatusPage;
