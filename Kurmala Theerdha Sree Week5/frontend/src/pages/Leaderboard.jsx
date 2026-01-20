import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../api";
import { motion } from "framer-motion";
import "./Leaderboard.css";

export default function Leaderboard() {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("global");
  const [leaderboard, setLeaderboard] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchLeaderboardData();
  }, [token, activeTab]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch appropriate leaderboard based on tab
      let endpoint = "/leaderboard/global";
      if (activeTab === "department") {
        endpoint = "/leaderboard/department";
      }

      console.log("Fetching leaderboard from:", endpoint);
      
      const [leaderboardRes, userRes] = await Promise.all([
        api.get(endpoint),
        api.get("/leaderboard/me")
      ]);

      console.log("Leaderboard response:", leaderboardRes.data);
      console.log("User info response:", userRes.data);

      setLeaderboard(leaderboardRes.data || []);
      setUserInfo(userRes.data);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      console.error("Error details:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getPointsBreakdown = (entry) => {
    const bragPoints = entry.brags_sent * 5;
    const appreciationPoints = entry.appreciations_received * 2;
    const reactionPoints = entry.reactions_given * 1;
    return { bragPoints, appreciationPoints, reactionPoints };
  };

  const getPointsColor = (points) => {
    if (points >= 500) return "#FFD700"; // Gold
    if (points >= 300) return "#C0C0C0"; // Silver
    if (points >= 100) return "#CD7F32"; // Bronze
    return "#666";
  };

  return (
    <div className="leaderboard-container">
      <motion.div
        className="leaderboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>🏆 Gamified Appreciation Leaderboard</h1>
        <p>Celebrate excellence and recognize top contributors</p>
      </motion.div>

      <div className="leaderboard-controls">
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === "global" ? "active" : ""}`}
            onClick={() => setActiveTab("global")}
          >
            🌍 Global
          </button>
          <button
            className={`tab-btn ${activeTab === "department" ? "active" : ""}`}
            onClick={() => setActiveTab("department")}
          >
            🏢 My Department
          </button>
        </div>
      </div>

      {userInfo && (
        <motion.div
          className="user-stats-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="stat-section">
            <h3>Your Position</h3>
            <div className="position-display">
              <div className="rank-badge" style={{ borderColor: getPointsColor(userInfo.total_points) }}>
                {getMedalEmoji(userInfo.rank)}
              </div>
              <div className="position-info">
                <div className="rank">Rank #{userInfo.rank}</div>
                <div className="points" style={{ color: getPointsColor(userInfo.total_points) }}>
                  {userInfo.total_points} Points
                </div>
              </div>
            </div>
          </div>

          <div className="stat-section">
            <h3>Your Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <div className="stat-label">Brags Sent</div>
                  <div className="stat-value">{userInfo.brags_sent}</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">👏</div>
                <div className="stat-content">
                  <div className="stat-label">Appreciated</div>
                  <div className="stat-value">{userInfo.appreciations_received}</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">❤️</div>
                <div className="stat-content">
                  <div className="stat-label">Reactions Given</div>
                  <div className="stat-value">{userInfo.reactions_given}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <motion.div
          className="leaderboard-table-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="leaderboard-scroll">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="rank-col">Rank</th>
                  <th className="name-col">User</th>
                  <th className="stat-col">Brags</th>
                  <th className="stat-col">Appreciated</th>
                  <th className="stat-col">Reactions</th>
                  <th className="points-col">Total Points</th>
                  <th className="breakdown-col">Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const breakdown = getPointsBreakdown(entry);
                  const pointsColor = getPointsColor(entry.total_points);

                  return (
                    <motion.tr
                      key={entry.user_id}
                      className="leaderboard-row"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                    >
                      <td className="rank-col">
                        <span className="rank-medal">{getMedalEmoji(entry.rank)}</span>
                      </td>
                      <td className="name-col">
                        <div className="user-info">
                          <div className="user-name">{entry.name || "Unknown"}</div>
                          {entry.department && entry.department !== "N/A" && (
                            <div className="user-dept">{entry.department}</div>
                          )}
                        </div>
                      </td>
                      <td className="stat-col stat-center">{entry.brags_sent}</td>
                      <td className="stat-col stat-center">{entry.appreciations_received}</td>
                      <td className="stat-col stat-center">{entry.reactions_given}</td>
                      <td className="points-col">
                        <span className="points-badge" style={{ backgroundColor: pointsColor, color: "#fff" }}>
                          {entry.total_points}
                        </span>
                      </td>
                      <td className="breakdown-col">
                        <div className="breakdown-tooltip">
                          <div className="breakdown-item">
                            <span className="breakdown-label">Brags:</span>
                            <span className="breakdown-value">{breakdown.bragPoints}pts</span>
                          </div>
                          <div className="breakdown-item">
                            <span className="breakdown-label">Appreciation:</span>
                            <span className="breakdown-value">{breakdown.appreciationPoints}pts</span>
                          </div>
                          <div className="breakdown-item">
                            <span className="breakdown-label">Reactions:</span>
                            <span className="breakdown-value">{breakdown.reactionPoints}pts</span>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <motion.div
        className="points-legend"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3>Scoring System</h3>
        <div className="legend-grid">
          <div className="legend-item">
            <span className="legend-icon">📝</span>
            <div className="legend-text">
              <strong>Brag Sent:</strong>
              <span>+5 points</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-icon">👏</span>
            <div className="legend-text">
              <strong>Appreciation Received:</strong>
              <span>+2 points per reaction/comment</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-icon">❤️</span>
            <div className="legend-text">
              <strong>Reaction Given:</strong>
              <span>+1 point per reaction</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
