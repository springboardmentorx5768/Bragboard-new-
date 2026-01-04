import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaUsers, FaEnvelope, FaBullhorn, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const Departments = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [shoutouts, setShoutouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDepartments, setExpandedDepartments] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const cacheBuster = `?_=${Date.now()}`;

      const [deptRes, usersRes, shoutRes] = await Promise.all([
        fetch(`/api/departments/${cacheBuster}`, { headers }).catch(e => ({ error: e })),
        fetch(`/api/users${cacheBuster}`, { headers }).catch(e => ({ error: e })),
        fetch(`/api/shoutouts/${cacheBuster}`, { headers }).catch(e => ({ error: e }))
      ]);

      const safeJson = async (res) => {
        if (res && res.ok) {
          try { return await res.json(); } catch (e) { return null; }
        }
        return null;
      };

      const [deptData, usersData, shoutData] = await Promise.all([
        safeJson(deptRes),
        safeJson(usersRes),
        safeJson(shoutRes)
      ]);

      if (deptData && Array.isArray(deptData)) {
        setDepartments(deptData);
        // Expand first department by default
        if (deptData.length > 0) {
          setExpandedDepartments({ [deptData[0].id]: true });
        }
      }

      if (usersData && Array.isArray(usersData)) {
        setAllUsers(usersData);
      }

      if (shoutData && Array.isArray(shoutData)) {
        setShoutouts(shoutData);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (deptId) => {
    setExpandedDepartments(prev => ({
      ...prev,
      [deptId]: !prev[deptId]
    }));
  };

  const getUsersByDepartment = (deptId) => {
    return allUsers.filter(user => user.department?.id === deptId);
  };

  const getUserPostCount = (userId) => {
    return shoutouts.filter(s => s.sender_id === userId).length;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-indigo-600 font-bold text-xl animate-pulse">
        Loading Departments...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight flex items-center gap-3">
          <FaBuilding className="text-indigo-600" />
          Departments & Staff
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          View all departments and their team members
        </p>
      </div>

      {/* Departments List */}
      <div className="space-y-4">
        {departments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
            <FaBuilding className="text-6xl text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400">No departments found</p>
          </div>
        ) : (
          departments.map((dept) => {
            const departmentUsers = getUsersByDepartment(dept.id);
            const isExpanded = expandedDepartments[dept.id];
            const totalPosts = departmentUsers.reduce((sum, user) => sum + getUserPostCount(user.id), 0);

            return (
              <div
                key={dept.id}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                {/* Department Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => toggleDepartment(dept.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <FaBuilding className="text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{dept.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {departmentUsers.length} {departmentUsers.length === 1 ? 'member' : 'members'} • {totalPosts} {totalPosts === 1 ? 'post' : 'posts'}
                        </p>
                        {dept.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{dept.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </div>
                </div>

                {/* Staff List */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
                    {departmentUsers.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No staff members in this department</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {departmentUsers.map((user) => {
                          const postCount = getUserPostCount(user.id);
                          return (
                            <div
                              key={user.id}
                              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover-lift"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                  {user.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 dark:text-white truncate">{user.name}</h4>
                                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <FaEnvelope className="text-xs" />
                                    <span className="truncate">{user.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full">
                                      <FaBullhorn className="text-xs" />
                                      <span className="font-bold">{postCount} {postCount === 1 ? 'post' : 'posts'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Card */}
      {departments.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Organization Summary</h3>
              <p className="text-indigo-100">
                {departments.length} {departments.length === 1 ? 'department' : 'departments'} • {allUsers.length} total {allUsers.length === 1 ? 'staff member' : 'staff members'}
              </p>
            </div>
            <FaUsers className="text-6xl opacity-20" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;



