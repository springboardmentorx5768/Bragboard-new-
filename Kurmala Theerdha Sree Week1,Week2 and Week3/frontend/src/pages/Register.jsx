import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/register", form);
      console.log("Registration successful:", response.data);
      alert("Registered successfully. Please login.");
      setForm({ name: "", email: "", password: "", department: "" });
      navigate("/login");
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message || "Registration failed";
      console.error("Registration error:", errorDetail);
      setError(errorDetail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="credify-wrapper">
      <div className="credify-left">
        <h1 className="credify-main-text">Credify - Register</h1>
      </div>

      <div className="credify-right">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="register-container"
        >
          <h2 className="register-title">Create Your Account</h2>

          {error && (
            <div className="bg-red-600/80 text-white p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-white text-xs">Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                className="register-input"
              />
            </div>

            <div>
              <label className="text-white text-xs">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={form.email}
                onChange={handleChange}
                className="register-input"
              />
            </div>

            <div>
              <label className="text-white text-xs">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create password"
                value={form.password}
                onChange={handleChange}
                className="register-input"
              />
            </div>

            <div>
              <label className="text-white text-xs">Department (Optional)</label>
              <input
                type="text"
                name="department"
                placeholder="Enter department"
                value={form.department}
                onChange={handleChange}
                className="register-input"
              />
            </div>

            <motion.button 
              type="submit"
              disabled={loading}
              className="register-button" 
              whileTap={{ scale: 0.95 }}
            >
              {loading ? "Registering..." : "Register"}
            </motion.button>
          </form>

          <p className="text-center text-white mt-4 text-sm">
            Already have an account?{" "}
            <a href="/login" className="underline text-white hover:text-yellow-200">
              Login
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
