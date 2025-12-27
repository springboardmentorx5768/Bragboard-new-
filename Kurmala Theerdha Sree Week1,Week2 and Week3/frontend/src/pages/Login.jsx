import { useState, useContext } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.username.trim() || !form.password.trim()) {
      setError("Please enter email and password");
      setLoading(false);
      return;
    }

    try {
      const loginData = {
        username: form.username,
        password: form.password
      };
      const res = await api.post("/auth/login", new URLSearchParams(loginData), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      console.log("Login successful:", res.data);
      setToken(res.data.access_token);
      localStorage.setItem("access_token", res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message || "Login failed";
      console.error("Login error:", errorDetail);
      setError(errorDetail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="credify-wrapper">
      <div className="credify-left">
        <h1 className="credify-main-text">Credify - Login</h1>
      </div>

      <div className="credify-right">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="login-container"
        >
          <h2 className="login-title">Login Now</h2>

          {error && (
            <div className="bg-red-600/80 text-white p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-white text-xs">Email</label>
              <input
                type="email"
                name="username"
                placeholder="Enter your email"
                value={form.username}
                onChange={handleChange}
                className="login-input"
              />
            </div>

            <div>
              <label className="text-white text-xs">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                className="login-input"
              />
              <a href="/forgot-password" className="forgot-link">
                Forgot Password?
              </a>
            </div>

            <motion.button 
              type="submit"
              disabled={loading}
              className="login-button" 
              whileTap={{ scale: 0.95 }}
            >
              {loading ? "Logging in..." : "Login"}
            </motion.button>
          </form>

          <p className="text-center text-white mt-4 text-sm">
            Don’t have an account?{" "}
            <a href="/register" className="underline text-white hover:text-yellow-200">
              Register
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
