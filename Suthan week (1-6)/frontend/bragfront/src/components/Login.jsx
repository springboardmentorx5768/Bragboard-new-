import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaArrowRight, FaBullhorn } from 'react-icons/fa';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Animated particles
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            animationDuration: 15 + Math.random() * 10,
            size: 2 + Math.random() * 4,
            delay: Math.random() * 5,
        }));
        setParticles(newParticles);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Login successful! Redirecting...');
                localStorage.setItem('token', data.access_token);
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                setMessage(data.detail || 'Login failed.');
                setIsLoading(false);
            }
        } catch (error) {
            setMessage('Network error. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated gradient background (Aligned with Register) */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 animate-gradient-shift"></div>

            {/* Floating particles */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute rounded-full bg-white/20 animate-float"
                    style={{
                        left: `${particle.left}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        animationDuration: `${particle.animationDuration}s`,
                        animationDelay: `${particle.delay}s`,
                    }}
                />
            ))}

            {/* Decorative blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8 animate-fade-in-down">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <FaBullhorn className="text-3xl text-yellow-400" />
                        <h1 className="text-4xl font-black text-white">BragBoard</h1>
                    </div>
                    <p className="text-gray-300">Level up your team culture</p>
                </div>

                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:shadow-purple-500/20 hover:scale-[1.02] animate-fade-in-up">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* User ID / Email */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaEnvelope className="text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Email Address or ID"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all hover:bg-black/40"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaLock className="text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                            </div>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all hover:bg-black/40"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/50 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50"
                        >
                            {isLoading ? 'Signing In...' : 'LOGIN'}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-6 text-center text-sm font-medium p-3 rounded-lg ${message.includes('successful') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {message}
                        </div>
                    )}

                    <div className="mt-8 text-center text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-purple-400 hover:text-purple-300 font-bold hover:underline transition-all">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
