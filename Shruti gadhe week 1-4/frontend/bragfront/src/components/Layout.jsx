import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaUsers, FaBuilding, FaSignOutAlt, FaMoon, FaSun } from 'react-icons/fa';

import NotificationCenter from './NotificationCenter';
import EditProfileModal from './EditProfileModal';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState('light');
    const [user, setUser] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await fetch('http://localhost:8000/api/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) setUser(await res.json());
                } catch (e) { console.error(e); }
            }
        };
        fetchUser();
        fetchUser();

        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Toggle theme
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
        { path: '/profile', label: 'My Profile', icon: <FaUser /> },
    ];

    return (
        <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-brand-dark text-white' : 'bg-slate-50 text-slate-900'}`}>
            {/* Floating Sidebar */}
            <div className="hidden md:flex flex-col p-6 pr-0">
                <aside className="w-64 lumina-glass flex flex-col z-20 transition-all duration-500 rounded-[2.5rem] relative h-full">
                    {/* Logo Area */}
                    <div className="p-8 pb-4">
                        <div className="flex items-center gap-3 lumina-glow">
                            <div className="w-10 h-10 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-primary/20">
                                BB
                            </div>
                            <span className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                BragBoard
                            </span>
                        </div>

                        {/* Theme Toggle Removed */}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-6 py-8 space-y-2 custom-scrollbar">
                        <p className="px-4 text-xs font-black text-slate-500 dark:text-white/90 uppercase tracking-[0.2em] mb-4">Core</p>
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${isActive
                                        ? 'bg-gradient-to-r from-brand-primary/20 to-transparent text-brand-primary border-l-2 border-brand-primary font-bold'
                                        : 'text-slate-600 dark:text-white hover:text-slate-900 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`text-xl transition-all ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`}>
                                        {item.icon}
                                    </span>
                                    <span className="text-sm tracking-wide">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / User Details */}
                    <div className="p-6 mt-auto">
                        {user && (
                            <div className="p-4 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-black shadow-lg overflow-hidden">
                                        {user.profile_picture ? (
                                            <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            user.name?.charAt(0)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</h4>
                                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto custom-scrollbar">
                {/* Nebula Overlay Elements */}
                <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-secondary/5 rounded-full blur-[150px] pointer-events-none" />

                <div className="relative p-6 md:p-12 max-w-7xl mx-auto min-h-full">
                    <header className="flex justify-between items-center mb-8 sticky top-0 z-40 py-4 bg-slate-50/80 dark:bg-brand-dark/80 backdrop-blur-xl -mx-6 px-6 md:-mx-12 md:px-12 transition-all border-b border-black/5 dark:border-white/5">
                        <div className="flex-1" />
                        <div className="flex actions items-center gap-4">
                            <button
                                onClick={toggleTheme}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-brand-primary border-white/5' : 'bg-slate-200 hover:bg-slate-300 text-brand-dark border-slate-300'}`}
                                title="Toggle Theme"
                            >
                                {theme === 'light' ? <FaMoon /> : <FaSun />}
                            </button>

                            <NotificationCenter />

                            {/* User Profile Dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                    className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-sm font-bold lumina-glow overflow-hidden hover:scale-105 transition-transform ${theme === 'dark' ? 'bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 text-white' : 'bg-slate-200 text-slate-700'}`}
                                >
                                    {user?.profile_picture ? (
                                        <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name ? user.name.charAt(0).toUpperCase() : <FaUser />
                                    )}
                                </button>

                                {showProfileDropdown && (
                                    <div className="absolute right-0 mt-4 w-48 rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl animate-fade-in z-50 bg-brand-dark/95 backdrop-blur-xl">
                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={() => {
                                                    setShowProfileDropdown(false);
                                                    setIsEditProfileOpen(true);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors text-left"
                                            >
                                                <FaUser /> Edit Profile
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowProfileDropdown(false);
                                                    handleLogout();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                            >
                                                <FaSignOutAlt /> Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>
                    <Outlet />
                </div>
            </main>

            <EditProfileModal
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                user={user}
                onUpdate={setUser}
            />
        </div >
    );
};

export default Layout;
