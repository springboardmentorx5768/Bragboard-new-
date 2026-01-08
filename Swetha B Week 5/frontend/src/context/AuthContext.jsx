import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('access_token'));

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'access_token') {
                setToken(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Auto-logout when token expires
    useEffect(() => {
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiryTime = payload.exp * 1000;
            const currentTime = Date.now();
            const timeLeft = expiryTime - currentTime;

            if (timeLeft <= 5000) { // If expired or less than 5 seconds left
                logout();
            } else {
                const timer = setTimeout(() => {
                    logout();
                }, timeLeft - 5000); // Logout 5 seconds early to be safe

                return () => clearTimeout(timer);
            }
        } catch (error) {
            console.error("Invalid token", error);
            logout();
        }
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('access_token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
