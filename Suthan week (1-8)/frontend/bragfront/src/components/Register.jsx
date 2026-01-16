import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaArrowRight, FaBullhorn } from 'react-icons/fa';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        department_id: null,
        role: 'employee'
    });
    const [departments, setDepartments] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Animated particles (Same as Login)
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

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fetch('/api/departments/');
                if (response.ok) {
                    const data = await response.json();
                    setDepartments(data);
                    if (data.length > 0) {
                        setFormData(prev => ({ ...prev, department_id: String(data[0].id) }));
                    } else {
                        setFormData(prev => ({ ...prev, department_id: null }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
            }
        };
        fetchDepartments();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'department_id' && value === '' ? null : value
        }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                department_id: formData.department_id ? Number(formData.department_id) : null,
            };

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Registration successful! Redirecting...');
                setTimeout(() => navigate('/login'), 1500);
            } else {
                setMessage(data.detail || 'Registration failed.');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Register fetch error:', error);
            setMessage('Network error. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* White Split Section - Registration Form */}
            <div className="w-1/2 bg-white flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-gray-800 mb-2">Create Your Account</h2>
                        <p className="text-gray-600">Join BragBoard and start celebrating!</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Name */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaUser className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-gray-200"
                            />
                        </div>

                        {/* Email */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaEnvelope className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-gray-200"
                            />
                        </div>

                        {/* Department */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaBuilding className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <select
                                name="department_id"
                                value={formData.department_id}
                                onChange={handleChange}
                                required
                                className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer hover:bg-gray-200"
                            >
                                <option value="" className="bg-white text-gray-900">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={String(dept.id)} className="bg-white text-gray-900">
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaLock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-gray-200"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/50 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50"
                        >
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-6 text-center text-sm font-medium p-3 rounded-lg ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message}
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold hover:underline transition-all">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Blue Split Section */}
            <div className="w-1/2 bg-blue-600 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="text-center">
                    <FaBullhorn className="text-6xl text-white mb-4 animate-bounce" />
                    <h1 className="text-7xl font-extrabold mb-4 leading-tight">BragBoard</h1>
                    <p className="text-2xl mb-4 font-light">Join the celebration, amplify your impact!</p>
                    <p className="text-lg opacity-80 max-w-md mx-auto">
                        Create your account to start recognizing your peers, sharing your achievements, and fostering a vibrant culture of appreciation.
                    </p>
                </div>
                {/* Optional: Add some subtle, abstract shapes or patterns here */}
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-500 rounded-full opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-72 h-72 bg-blue-700 rounded-full opacity-20 animate-blob animation-delay-2000"></div>
            </div>
        </div>
    );
}

export default Register;
