import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        department_id: '',
        role: 'employee'
    });
    const [departments, setDepartments] = useState([]);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch departments for dropdown
        const fetchDepartments = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/departments/');
                if (res.ok) {
                    const data = await res.json();
                    setDepartments(data);
                    // Set default if available
                    if (data.length > 0) {
                        setFormData(prev => ({ ...prev, department_id: data[0].id }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch departments", err);
            }
        };
        fetchDepartments();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Registration successful! Redirecting...');
                setTimeout(() => navigate('/login'), 1500);
            } else {
                setMessage(data.detail || 'Registration failed.');
            }
        } catch (error) {
            setMessage('Network error. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-[#4f2e81] p-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl transform transition hover:-translate-y-1 hover:shadow-3xl">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                        Create Account
                    </h2>
                    <p className="text-gray-300">Join BragBoard today</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />

                    <div className="relative">
                        <select
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleChange}
                            required
                            className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                            <option value="" disabled className="text-gray-800">Select Department</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id} className="text-gray-800">
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />

                    <button
                        type="submit"
                        className="w-full py-4 mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transform transition hover:-translate-y-0.5"
                    >
                        Sign Up
                    </button>
                </form>

                {message && (
                    <div className={`mt-6 text-center text-sm font-medium ${message.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </div>
                )}

                <div className="mt-8 text-center text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
