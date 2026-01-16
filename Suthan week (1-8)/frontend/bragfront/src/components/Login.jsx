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

    const [loginType, setLoginType] = useState('employee'); // 'employee' or 'admin'

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email, // Backend handles email or user_id in 'email' field
                    password: password,
                    login_type: loginType
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Login successful! Redirecting...');
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('role', data.role);
                setTimeout(() => {
                    if (data.role === 'admin') {
                        navigate('/admin-dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                }, 1500);
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row min-h-[600px]">

                {/* Visual Section */}
                <div className={`w-full md:w-1/2 p-10 text-white flex flex-col justify-center relative transition-all duration-500 ${loginType === 'admin' ? 'bg-indigo-900' : 'bg-blue-600'}`}>
                    <div className="relative z-10">
                        <FaBullhorn className="text-5xl mb-6 animate-bounce" />
                        <h1 className="text-4xl font-extrabold mb-4">BragBoard</h1>
                        <p className="text-xl mb-6 font-light">
                            {loginType === 'admin' ? 'Admin Portal' : 'Employee Portal'}
                        </p>
                        <p className="opacity-90">
                            {loginType === 'admin'
                                ? 'Manage your team, oversee shoutouts, and ensure a positive culture.'
                                : 'Celebrate achievements, amplify success, and recognize your colleagues!'}
                        </p>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                </div>

                {/* Login Form Section */}
                <div className="w-full md:w-1/2 p-10 flex flex-col justify-center bg-white">
                    <div className="mb-8">
                        <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                            <button
                                onClick={() => { setLoginType('employee'); setMessage(''); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${loginType === 'employee' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Employee Login
                            </button>
                            <button
                                onClick={() => { setLoginType('admin'); setMessage(''); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${loginType === 'admin' ? 'bg-white shadow text-indigo-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Admin Login
                            </button>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
                        <p className="text-gray-500 text-sm">
                            {loginType === 'admin' ? 'Please enter your admin credentials.' : 'Please enter your username and password.'}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* User ID / Email Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaEnvelope className={`${loginType === 'admin' ? 'text-indigo-900' : 'text-blue-500'}`} />
                            </div>
                            <input
                                type="text"
                                placeholder={loginType === 'admin' ? "Admin Email" : "Username / User ID"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-medium"
                                style={{ borderColor: 'transparent', boxShadow: 'none' }} // Tailwind focus ring handles visuals
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaLock className={`${loginType === 'admin' ? 'text-indigo-900' : 'text-blue-500'}`} />
                            </div>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-medium"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3.5 mt-2 font-bold rounded-xl shadow-lg transform transition-all hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 ${loginType === 'admin'
                                ? 'bg-indigo-900 hover:bg-indigo-800 text-white shadow-indigo-900/30'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                                }`}
                        >
                            {isLoading ? 'Signing In...' : 'Login'}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-6 text-center text-sm font-medium p-3 rounded-lg animate-fade-in ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {message}
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-sm">
                            Don't have an account? <Link to="/register" className={`font-bold hover:underline ${loginType === 'admin' ? 'text-indigo-900' : 'text-blue-600'}`}>Sign up</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
