import React, { useState, useEffect } from "react";
import "./LoginRegister.css";
import { FaUser, FaLock, FaEnvelope, FaSignInAlt, FaBriefcase, FaPaperPlane, FaThLarge, FaUsers, FaFilter, FaCheckCircle, FaCommentAlt, FaReply } from "react-icons/fa"; 

const API_BASE = "http://localhost:8000";

const reactBtnStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid #54545b',
    color: 'white',
    padding: '5px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.3s ease', 
};

const Dashboard = ({ userName, userDepartment, userRole }) => {
    const [image, setImage] = useState(null);
    const [shoutouts, setShoutouts] = useState([]);
    const [usersList, setUsersList] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("dashboard"); 
    const [message, setMessage] = useState("");
    const [recipientIds, setRecipientIds] = useState(""); 
    const [actionMsg, setActionMsg] = useState(""); 
    const [commentText, setCommentText] = useState("");
    const [activeCommentBox, setActiveCommentBox] = useState(null);

    const [filterDept, setFilterDept] = useState("");
    const [filterSenderId, setFilterSenderId] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const departments = ["CSE", "CIVIL", "ECE", "MECH", "STAFF", "ADMIN"];

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        window.location.reload(); 
    };

    const fetchDashboardData = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        setLoading(true);
        try {
            let queryParams = new URLSearchParams();
            if (filterDept) queryParams.append("dept", filterDept);
            if (filterSenderId) queryParams.append("sender_id", filterSenderId);
            if (filterDate) queryParams.append("date", filterDate);

            const resShout = await fetch(`${API_BASE}/shoutouts/?${queryParams.toString()}`, { 
                headers: { "Authorization": `Bearer ${token}` } 
            });
            const dataShout = await resShout.json();
            setShoutouts(Array.isArray(dataShout) ? dataShout : []);

            const resUsers = await fetch(`${API_BASE}/users/`, { 
                headers: { "Authorization": `Bearer ${token}` } 
            });
            const dataUsers = await resUsers.json();
            setUsersList(Array.isArray(dataUsers) ? dataUsers : []);
        } catch (error) { console.error("Fetch failed:", error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchDashboardData(); }, [filterDept, filterSenderId, filterDate]);


    const handlePostComment = async (shoutoutId, parentId = null) => {
        const token = localStorage.getItem("access_token");
        if (!commentText.trim()) return;
        try {
            const res = await fetch(`${API_BASE}/shoutouts/${shoutoutId}/comment?content=${encodeURIComponent(commentText)}${parentId ? `&parent_id=${parentId}` : ''}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setActionMsg("Comment posted successfully!");
                setCommentText("");
                setActiveCommentBox(null);
                await fetchDashboardData(); 
                setTimeout(() => setActionMsg(""), 2000);
            }
        } catch (error) { console.error("Comment failed", error); }
    };

    const handleReaction = async (shoutoutId, type) => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`${API_BASE}/shoutouts/${shoutoutId}/react?reaction_type=${type}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setActionMsg(`Your ${type} has been recorded!`);
                await fetchDashboardData(); 
                setTimeout(() => setActionMsg(""), 2000);
            }
        } catch (error) { console.error("Reaction failed", error); }
    };

    const handlePostShoutout = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("access_token");
        const formData = new FormData();
        formData.append("message", message);
        formData.append("recipient_ids", recipientIds);
        if (image) formData.append("image", image);
        try {
            const res = await fetch(`${API_BASE}/shoutouts/`, { 
                method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData 
            });
            if (res.ok) {
                alert("Shoutout posted!");
                setMessage(""); setRecipientIds(""); setImage(null);
                setView("dashboard"); fetchDashboardData();
            }
        } catch (error) { console.error("Post failed:", error); }
    };

    return (
        <div className="dashboard-fixed-layout">
            {actionMsg && (
                <div style={{
                    position: 'fixed', top: '80px', right: '20px', background: '#2ecc71', color: 'white',
                    padding: '10px 20px', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', animation: 'fadeIn 0.5s'
                }}>
                    <FaCheckCircle /> {actionMsg}
                </div>
            )}

            <aside className="sidebar-section">
                <div className="app-branding"><div className="logo-icon">BB</div><h2 className="logo-name">BragBoard</h2></div>
                <nav className="sidebar-menu-nav">
                    <button className={`nav-btn-item ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}><FaThLarge className="mr-2" /> Dashboard</button>
                    <button className={`nav-btn-item ${view === "createPost" ? "active" : ""}`} onClick={() => setView("createPost")}><FaPaperPlane className="mr-2" /> Create Post</button>
                    <button className={`nav-btn-item ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}><FaUser className="mr-2" /> My Profile</button>
                </nav>
                {/* <div className="teammates-id-card" style={{ marginTop: '20px', padding: '15px', background: '#0D264E', borderRadius: '12px', border: '1px solid #4F46E5' }}>
                    <h3 style={{ color: '#8B5CF6', fontSize: '0.8rem', marginBottom: '10px' }}><FaUsers /> TEAM MEMBERS</h3>
                    <div style={{ overflowY: 'auto', maxHeight: '160px' }}>
                        {usersList.map(member => (
                            <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ffffff11' }}>
                                <span style={{ color: 'white', fontSize: '0.75rem' }}>{member.name}</span>
                                <span style={{ color: '#8B5CF6', fontWeight: 'bold', fontSize: '0.75rem' }}>ID: {member.id}</span>
                            </div>
                        ))}
                    </div>
                </div> */}
                {/* <div className="sidebar-footer-profile">
                    <div className="avatar-small">{userName?.charAt(0).toUpperCase()}</div><p>{userName}</p>
                </div> */}
            </aside>

            <main className="dashboard-main-content">
                <header className="main-navbar"><h1 className="nav-center-title">Welcome to BragBoard Dashboard</h1><button onClick={handleLogout} className="nav-logout-btn">Logout</button></header>
                <div className="scrollable-feed-container">
                    <div className="feed-inner-content">
                        {view === "dashboard" && (
                            <>
                                <h2 className="section-header-text">Department Feed</h2>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '15px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '12px', border: '1px solid #4F46E5', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ color: '#8B5CF6', fontSize: '0.8rem', fontWeight: 'bold' }}><FaFilter /> FILTERS:</span>
                                    <select style={{ background: '#0D264E', color: 'white', border: '1px solid #4F46E5', borderRadius: '4px', padding: '5px' }} value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                                        <option value="">All Departments</option>
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <input type="text" placeholder="Sender ID" style={{ background: '#0D264E', color: 'white', border: '1px solid #4F46E5', borderRadius: '4px', padding: '5px', width: '100px' }} value={filterSenderId} onChange={(e) => setFilterSenderId(e.target.value)} />
                                    <input type="date" style={{ background: '#0D264E', color: 'white', border: '1px solid #4F46E5', borderRadius: '4px', padding: '5px' }} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                                    <button onClick={() => {setFilterDept(""); setFilterSenderId(""); setFilterDate("");}} style={{ background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.7rem' }}>CLEAR</button>
                                </div>

                                {loading ? <p style={{color: "white", textAlign: "center"}}>Loading Feed...</p> : (
                                    shoutouts.map(s => (
                                        <div key={s.id} className="shoutout-item" style={{ padding: '20px', marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <div style={{ color: '#8B5CF6', fontWeight: 'bold', fontSize: '0.85rem' }}>From: {s.sender_name}</div>
                                                <div style={{ background: '#4F46E5', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 'bold', border: '1px solid #8B5CF6' }}>RECOGNIZING: {s.target_dept?.toUpperCase()}</div>
                                            </div>
                                            <p className="msg-content">{s.message}</p>
                                            {s.image_url && <div style={{ marginTop: '15px', borderRadius: '8px', overflow: 'hidden' }}><img src={`${API_BASE}${s.image_url}`} alt="post" style={{ width: '100%', height: 'auto' }} /></div>}
                                            <small className="date-footer">{new Date(s.created_at).toLocaleDateString()}</small>
                                            
                                            <div style={{ display: 'flex', gap: '15px', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ffffff11' }}>
                                                <button className="react-btn" onClick={() => handleReaction(s.id, 'like')} style={reactBtnStyle}>
                                                    👍 <span>{s.reaction_counts?.like || 0}</span>
                                                </button>
                                                <button className="react-btn" onClick={() => handleReaction(s.id, 'clap')} style={reactBtnStyle}>
                                                    👏 <span>{s.reaction_counts?.clap || 0}</span>
                                                </button>
                                                <button className="react-btn" onClick={() => handleReaction(s.id, 'star')} style={reactBtnStyle}>
                                                    ⭐ <span>{s.reaction_counts?.star || 0}</span>
                                                </button>
                                            </div>

                                            {}
                                            <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                                <h4 style={{ color: '#8B5CF6', fontSize: '0.75rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <FaCommentAlt /> Conversation
                                                </h4>
                                                
                                                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '10px' }}>
                                                    {s.comments && s.comments.map(c => (
                                                        <div key={c.id} style={{ marginLeft: c.parent_id ? '35px' : '0', marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                                                <div className="avatar-small" style={{ width: '25px', height: '25px', fontSize: '0.7rem' }}>
                                                                    {c.user_name ? c.user_name.charAt(0).toUpperCase() : "?"}
                                                                </div>
                                                                <span style={{ color: '#8B5CF6', fontSize: '0.75rem', fontWeight: 'bold' }}>{c.user_name}</span>
                                                                <span style={{ color: '#64748b', fontSize: '0.65rem' }}>{new Date(c.created_at).toLocaleTimeString()}</span>
                                                            </div>
                                                            <p style={{ color: 'white', fontSize: '0.85rem', marginLeft: '35px' }}>{c.content}</p>
                                                            <button 
                                                                onClick={() => setActiveCommentBox(activeCommentBox === `reply-${c.id}` ? null : `reply-${c.id}`)}
                                                                style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.7rem', marginLeft: '35px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}
                                                            >
                                                                <FaReply /> Reply
                                                            </button>
                                                            
                                                            {activeCommentBox === `reply-${c.id}` && (
                                                                <div style={{ marginLeft: '35px', marginTop: '10px', display: 'flex', gap: '8px' }}>
                                                                    <input type="text" placeholder="Write a reply..." className="role-select" value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ flex: 1, padding: '5px', fontSize: '0.8rem' }} />
                                                                    <button onClick={() => handlePostComment(s.id, c.id)} style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', fontSize: '0.8rem' }}>Post</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Add a comment..." 
                                                        className="role-select" 
                                                        value={activeCommentBox === `main-${s.id}` ? commentText : ""} 
                                                        onFocus={() => {setActiveCommentBox(`main-${s.id}`); setCommentText("");}} 
                                                        onChange={(e) => setCommentText(e.target.value)} 
                                                        style={{ flex: 1, padding: '10px' }} 
                                                    />
                                                    {activeCommentBox === `main-${s.id}` && (
                                                        <button onClick={() => handlePostComment(s.id)} style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>Post</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </>
                        )}
                        {view === "createPost" && (
                            <div className="create-post-container">
                                <h2 className="section-header-text">Celebrate a Colleague</h2>
                                <form onSubmit={handlePostShoutout} className="shoutout-form">
                                    <div className="form-group"><label>Message</label><textarea placeholder="Write appreciation..." value={message} onChange={(e) => setMessage(e.target.value)} required /></div>
                                    <div className="form-group">
                                        <label>Tag Recipient (Select Department or Use IDs)</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <select className="role-select" style={{ flex: 1 }} onChange={(e) => setRecipientIds(e.target.value)}>
                                                <option value="">Select Department...</option>
                                                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                            </select>
                                            <input type="text" placeholder="Or IDs (1, 2)" style={{ flex: 1 }} value={recipientIds} onChange={(e) => setRecipientIds(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="form-group"><label>Upload Photo</label><input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} style={{ color: 'white' }} /></div>
                                    <button type="submit" className="form-btn post-btn">Send Shoutout</button>
                                </form>
                            </div>
                        )}
                        {view === "profile" && (
                            <div className="profile-details-wrapper">
                                <h2 className="section-header-text">User Profile : </h2>
                                <div className="info-item"><span className="info-label"><FaUser /> NAME : </span><span className="info-value">{userName}</span></div>
                                <div className="info-item"><span className="info-label"><FaBriefcase /> DEPARTMENT : </span><span className="info-value">{userDepartment}</span></div>
                                <div className="info-item"><span className="info-label"><FaSignInAlt /> ROLE : </span><span className="info-value text-purple">{userRole}</span></div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const LoginRegister = () => {
    const [mode, setMode] = useState("login");
    const [user, setUser] = useState(null); 
    const [form, setForm] = useState({ name: "", email: "", password: "", department: "", role: "EMPLOYEE" });
    const [statusMsg, setStatusMsg] = useState("");

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email, password: form.password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Login failed");
            
            localStorage.setItem("access_token", data.access_token);
            setStatusMsg("Login Successful! Securely redirecting to your dashboard...");
            setTimeout(() => {
                setUser({ name: data.user_name, department: data.department, role: data.role }); 
                setStatusMsg("");
            }, 1500);
        } catch (err) { setStatusMsg("Error: " + err.message); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, role: form.role.toUpperCase() }),
            });
            if (!res.ok) throw new Error("Registration failed");
            setStatusMsg("Registration Successful! Redirecting to login...");
            setTimeout(() => { setMode("login"); setStatusMsg(""); }, 2000); 
        } catch (err) { setStatusMsg("Error: " + err.message); }
    };

    if (user) return <Dashboard userName={user.name} userDepartment={user.department} userRole={user.role} />;

    return (
        <div className="login-page-bg">
            <div className="wrapper">
                <div className="form-box">
                    <h2>{mode === "login" ? "Login" : "Register"}</h2>
                    {statusMsg && <p className="msg-text" style={{ color: statusMsg.startsWith("Error") ? '#ff4d4d' : '#2ecc71', textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' }}>{statusMsg}</p>}
                    <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
                        {mode === "register" && <div className="input-box"><FaUser className="icon" /><input type="text" name="name" onChange={handleChange} required /><label>Full Name</label></div>}
                        <div className="input-box"><FaEnvelope className="icon" /><input type="email" name="email" onChange={handleChange} required /><label>Email</label></div>
                        <div className="input-box"><FaLock className="icon" /><input type="password" name="password" onChange={handleChange} required /><label>Password</label></div>
                        {mode === "register" && (
                            <>
                                <div className="input-box"><FaBriefcase className="icon" /><input type="text" name="department" onChange={handleChange} required /><label>Department</label></div>
                                <div className="input-box select-box">
                                    <select name="role" value={form.role} onChange={handleChange} className="role-select">
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="STUDENT">Student</option>
                                        <option value="STAFF">Staff</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                            </>
                        )}
                        <button type="submit" className="form-btn">Submit</button>
                        <div className="register-link"><p>{mode === "login" ? "No account?" : "Have account?"} <a href="#" onClick={() => {setMode(mode === "login" ? "register" : "login"); setStatusMsg("");}}>{mode === "login" ? "Register" : "Login"}</a></p></div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginRegister;