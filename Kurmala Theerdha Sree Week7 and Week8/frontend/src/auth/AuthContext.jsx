/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("access_token") || "");

  const saveToken = (t) => {
    localStorage.setItem("access_token", t);
    setToken(t);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken("");
  };

  return (
    <AuthContext.Provider value={{ token, setToken: saveToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
