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
        // Generate random particles
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
                setMessage('Signin successful! Redirecting...');
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
            {/* Animated gradient background */}
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

            {/* Login card */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo and branding */}
                <div className="text-center mb-8 animate-fade-in-down">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50 animate-bounce-slow">
                            <FaBullhorn className="text-3xl text-white" />
                        </div>
                        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-text">
                            BragBoard
                        </h1>
                    </div>
                    <p className="text-gray-300 text-lg">Celebrate your achievements together</p>
                </div>

                {/* Main login form */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:shadow-purple-500/20 hover:scale-[1.02] animate-fade-in-up">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-white mb-2">
                            Welcome Back!
                        </h2>
                        <p className="text-gray-300">Sign in to continue your journey</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email/ID input */}
                        <div className="group">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address or User ID</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaEnvelope className="text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="you@example.com or 1234"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-black/40 hover-glow"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">You can login with your email or 4-digit User ID</p>
                        </div>

                        {/* Password input */}
                        <div className="group">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaLock className="text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-black/40"
                                />
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/50 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Message display */}
                    {message && (
                        <div className={`mt-6 p-4 rounded-xl text-center font-medium animate-fade-in ${message.includes('successful')
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                            {message}
                        </div>
                    )}

                    {/* Sign up link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-400">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-purple-400 hover:text-purple-300 font-bold hover:underline transition-all inline-flex items-center gap-1 group"
                            >
                                Sign up now
                                <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-gray-400 text-sm animate-fade-in">
                    <p>© 2025 BragBoard. Celebrate Success Together.</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
