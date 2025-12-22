import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaUsers, FaBuilding, FaSignOutAlt, FaMoon, FaSun } from 'react-icons/fa';

import NotificationCenter from './NotificationCenter';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState('light');

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
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

                        {/* Theme Toggle (Simplified for Lumina) */}
                        <button
                            onClick={toggleTheme}
                            className={`mt-8 w-full flex items-center justify-between gap-2 px-6 py-3 rounded-2xl transition-all text-xs font-black uppercase tracking-widest border ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-brand-primary border-white/5' : 'bg-slate-200 hover:bg-slate-300 text-brand-dark border-slate-300'}`}
                        >
                            <span className="flex items-center gap-2">
                                {theme === 'light' ? <FaMoon /> : <FaSun />}
                                {theme === 'light' ? 'Dark' : 'Light'}
                            </span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-brand-primary' : 'bg-slate-400'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${theme === 'dark' ? 'right-0.5' : 'left-0.5'}`} />
                            </div>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-6 py-8 space-y-2 custom-scrollbar">
                        <p className="px-4 text-[10px] font-black text-slate-500 dark:text-white/90 uppercase tracking-[0.2em] mb-4">Core</p>
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

                    {/* Footer / Logout */}
                    <div className="p-6">
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-3 w-full px-6 py-4 text-slate-600 dark:text-white hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all text-sm font-bold"
                        >
                            <FaSignOutAlt />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </aside>
            </div>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto custom-scrollbar">
                {/* Nebula Overlay Elements */}
                <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-secondary/5 rounded-full blur-[150px] pointer-events-none" />

                <div className="relative p-6 md:p-12 max-w-7xl mx-auto min-h-full">
                    <header className="flex justify-between items-center mb-12">
                        <div className="flex-1" />
                        <div className="flex items-center gap-6">
                            <NotificationCenter />
                            {/* Simple user initial circle */}
                            <div className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-xs font-bold lumina-glow ${theme === 'dark' ? 'bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                U
                            </div>
                        </div>
                    </header>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
