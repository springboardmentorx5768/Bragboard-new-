import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./LoginRegister.css";
import { FaUser, FaLock, FaEnvelope, FaKey } from "react-icons/fa";

const API_BASE = "http://localhost:8000";

import InteractiveBackground from "../InteractiveBackground";

const LoginRegister = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // 'login' | 'register' | 'forgot' | 'reset'
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    role: "employee",
  });
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = Array.isArray(data.detail)
          ? data.detail.map((err) => `${err.loc[1]}: ${err.msg}`).join(", ")
          : data.detail || "Login failed";
        throw new Error(errorMsg);
      }
      // Save token
      sessionStorage.setItem("access_token", data.access_token);
      setMessage("Login successful!");
      navigate('/success');
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          department: form.department || "Engineering",
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = Array.isArray(data.detail)
          ? data.detail.map((err) => `${err.loc[1]}: ${err.msg}`).join(", ")
          : data.detail || "Registration failed";
        throw new Error(errorMsg);
      }
      setMessage("Registration successful! Please login.");
      setMode("login");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Request failed");

      setMessage("Email verified! Enter new password.");
      setMode("reset");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");

      setMessage("Password reset successful! Please login.");
      setMode("login");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="login-page-container">
      <InteractiveBackground />

      <div className={`wrapper${mode === "register" ? " active" : ""}`} style={{ zIndex: 1 }}>
        {/* LOGIN FORM (Also handles Forgot/Reset views) */}
        <div className="form-box login">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-6 text-center">BragBoard</h2>
          {mode === "login" && (
            <>
              <h1>Login</h1>
              {message && <p className="info-msg">{message}</p>}
              <form onSubmit={handleLogin}>
                <div className="input-box">
                  <span className="icon"><FaEnvelope /></span>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required />
                  <label>Email</label>
                </div>
                <div className="input-box">
                  <span className="icon"><FaLock /></span>
                  <input type="password" name="password" value={form.password} onChange={handleChange} required />
                  <label>Password</label>
                </div>
                <button type="submit">Login</button>
                <div className="register-link">
                  <p>
                    <a href="#" onClick={() => setMode("forgot")}>Forgot Password?</a>
                  </p>
                  <p>
                    Don&apos;t have an account? <a href="#" onClick={() => setMode("register")}>Register</a>
                  </p>
                </div>
              </form>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h1>Forgot Password</h1>
              {message && <p className="info-msg">{message}</p>}
              <form onSubmit={handleForgot}>
                <div className="input-box">
                  <span className="icon"><FaEnvelope /></span>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required />
                  <label>Enter your email</label>
                </div>
                <button type="submit">Verify Email</button>
                <div className="register-link">
                  <p><a href="#" onClick={() => setMode("login")}>Back to Login</a></p>
                </div>
              </form>
            </>
          )}

          {mode === "reset" && (
            <>
              <h1>Reset Password</h1>
              {message && <p className="info-msg">{message}</p>}
              <form onSubmit={handleReset}>
                <div className="input-box">
                  <span className="icon"><FaLock /></span>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  <label>New Password</label>
                </div>
                <button type="submit">Reset Password</button>
                <div className="register-link">
                  <p><a href="#" onClick={() => setMode("login")}>Back to Login</a></p>
                </div>
              </form>
            </>
          )}
        </div>

        {/* REGISTER FORM */}
        <div className="form-box register">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-6 text-center">BragBoard</h2>
          <h1>Register</h1>
          {message && mode === "register" && <p className="info-msg">{message}</p>}
          <form onSubmit={handleRegister}>
            <div className="input-box">
              <span className="icon"><FaUser /></span>
              <input name="name" value={form.name} onChange={handleChange} required />
              <label>Full Name</label>
            </div>
            <div className="input-box">
              <span className="icon"><FaEnvelope /></span>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
              <label>Email</label>
            </div>
            <div className="input-box">
              <span className="icon"><FaLock /></span>
              <input type="password" name="password" value={form.password} onChange={handleChange} required />
              <label>Password</label>
            </div>
            <div className="input-box">
              <input name="department" value={form.department} onChange={handleChange} required />
              <label>Department</label>
            </div>
            <div className="input-box hidden">
              <input name="role" value="employee" type="hidden" />
            </div>
            <button type="submit">Register</button>
            <div className="register-link">
              <p>
                Already have an account? <a href="#" onClick={() => setMode("login")}>Login</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
