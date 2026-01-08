import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaBuilding, FaSignOutAlt, FaMoon, FaSun, FaBullhorn, FaBell, FaCheck, FaTrash } from 'react-icons/fa';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState('light');
    const [user, setUser] = useState(null);
    const token = localStorage.getItem('token');

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                }
            } catch (error) {
                console.error("Failed to fetch user", error);
            }
        };
        if (token) {
            fetchUser();
        }
    }, [token]);

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

    const [receivedShoutoutsCount, setReceivedShoutoutsCount] = useState(0);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Fetch received shoutouts count (only unviewed)
    useEffect(() => {
        const fetchShoutoutsCount = async () => {
            try {
                const response = await fetch('/api/shoutouts/received?unviewed_only=true', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setReceivedShoutoutsCount(Array.isArray(data) ? data.length : 0);
                }
            } catch (error) {
                console.error("Failed to fetch shoutouts count", error);
            }
        };
        if (token) {
            fetchShoutoutsCount();
            // Refresh count every 30 seconds
            const interval = setInterval(fetchShoutoutsCount, 30000);
            return () => clearInterval(interval);
        }
    }, [token]);

    // Refresh count when navigating to notifications page
    useEffect(() => {
        if (location.pathname === '/notifications' && token) {
            const fetchShoutoutsCount = async () => {
                try {
                    const response = await fetch('/api/shoutouts/received?unviewed_only=true', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setReceivedShoutoutsCount(Array.isArray(data) ? data.length : 0);
                    }
                } catch (error) {
                    console.error("Failed to fetch shoutouts count", error);
                }
            };
            fetchShoutoutsCount();
        }
    }, [location.pathname, token]);

    // Notifications Logic
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    const fetchNotifications = async () => {
        try {
            const cacheBuster = `?_=${Date.now()}`;
            const response = await fetch(`/api/notifications/${cacheBuster}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(Array.isArray(data) ? data : []);
                setUnreadNotifCount(data.filter(n => n.is_read === 'false' || !n.is_read).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [token]);

    const markAsRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 'true' } : n));
            setUnreadNotifCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark read", error);
        }
    };

    const markAllRead = async () => {
        try {
            await fetch(`/api/notifications/mark-all-read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 'true' })));
            setUnreadNotifCount(0);
        } catch (error) {
            console.error("Failed to mark all read", error);
        }
    };

    // Close Notif dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.notif-dropdown-container')) {
                setShowNotifDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
        { path: '/profile', label: 'My Profile', icon: <FaUser /> },
        { path: '/notifications', label: 'Shout-Outs for You', icon: <FaBullhorn />, badge: receivedShoutoutsCount },
        { path: '/departments', label: 'Departments & Staff', icon: <FaBuilding /> },
    ];

    const [showUserDropdown, setShowUserDropdown] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.user-dropdown-container')) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
            {/* Sidebar - Collapsible */}
            <aside
                className={`bg-white dark:bg-gray-800 shadow-2xl flex flex-col z-20 transition-all duration-300 ease-in-out relative ${isSidebarExpanded ? 'w-72' : 'w-20'
                    }`}
            >
                {/* Logo Area */}
                <div className="p-4 pb-4">
                    <div
                        className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 flex-shrink-0">
                                BB
                            </div>
                            <span
                                className={`text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight whitespace-nowrap transition-all duration-300 ${isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                                    }`}
                            >
                                BragBoard
                            </span>
                        </div>


                    </div>

                    {/* Theme Toggle - Only show when expanded */}
                    {isSidebarExpanded && (
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors text-sm font-medium"
                            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {theme === 'light' ? (
                                <>
                                    <FaMoon className="text-indigo-600" />
                                    <span>Dark Mode</span>
                                </>
                            ) : (
                                <>
                                    <FaSun className="text-yellow-400" />
                                    <span>Light Mode</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
                    {isSidebarExpanded && (
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
                    )}
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative hover-lift ${isSidebarExpanded ? '' : 'justify-center'
                                    } ${isActive
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                title={!isSidebarExpanded ? item.label : ''}
                            >
                                <span className={`text-lg transition-all flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-gray-400 group-hover:text-gray-500 group-hover:scale-110'}`}>
                                    {item.icon}
                                </span>
                                {isSidebarExpanded && (
                                    <>
                                        <span className="flex-1 whitespace-nowrap overflow-hidden">{item.label}</span>
                                        {item.badge > 0 && (
                                            <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg animate-glow-pulse">
                                                {item.badge}
                                            </span>
                                        )}
                                        {isActive && !item.badge && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce-gentle" />}
                                    </>
                                )}
                                {!isSidebarExpanded && item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-glow-pulse"></span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Section Link (Bottom of Sidebar) */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                    <Link to="/profile" className="block">
                        <div className={`flex items-center gap-3 cursor-pointer hover:opacity-90 transition-all hover-scale ${isSidebarExpanded ? '' : 'justify-center'
                            }`}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-700 flex-shrink-0">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            {isSidebarExpanded && (
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white truncate text-sm">
                                        {user?.name || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {user?.department?.name || 'Department'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {/* Top decorative gradient mesh */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 pointer-events-none" />

                {/* Notifications & Profile Top Bar */}
                <div className="absolute top-6 right-6 md:right-10 z-10 flex items-center gap-4">

                    {/* Notification Bell */}
                    <div className="relative notif-dropdown-container">
                        <button
                            className="relative p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-md hover:shadow-lg transition-all text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                        >
                            <FaBell className="text-xl" />
                            {unreadNotifCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-bounce-gentle">
                                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifDropdown && (
                            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-scale-in origin-top-right z-50">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                                    {unreadNotifCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                        >
                                            <FaCheck /> Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400">
                                            <FaBell className="mx-auto text-3xl mb-2 opacity-20" />
                                            <p className="text-sm">No notifications yet</p>
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`p-4 flex gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${notif.is_read === 'false' || !notif.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                                onClick={() => markAsRead(notif.id)}
                                            >
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actor_id || 'sys'}`}
                                                        alt="User"
                                                        className="w-10 h-10 rounded-full bg-gray-200"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                                        <span className="font-bold">{notif.actor?.name || 'Someone'}</span> {notif.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(notif.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                {(!notif.is_read || notif.is_read === 'false') && (
                                                    <div className="flex-shrink-0 self-center">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="relative user-dropdown-container">
                        <div
                            className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all cursor-pointer"
                            onClick={() => setShowUserDropdown(!showUserDropdown)}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {user?.name || 'User'}
                                </p>
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        {showUserDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-scale-in origin-top-right">
                                <Link
                                    to="/profile"
                                    className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => setShowUserDropdown(false)}
                                >
                                    <div className="flex items-center gap-2">
                                        <FaUser className="text-gray-400" />
                                        Edit Profile
                                    </div>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
                                >
                                    <div className="flex items-center gap-2 font-bold">
                                        <FaSignOutAlt />
                                        Sign Out
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative p-6 md:p-10 max-w-7xl mx-auto min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;

