import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setLoading(false); return; }

    authService.getMe()
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem("accessToken"))
      .finally(() => setLoading(false));
  }, []);

  const register = async (data) => {
    const res = await authService.register(data);
    const { user, accessToken } = res.data.data;
    localStorage.setItem("accessToken", accessToken);
    setUser(user);
    return user;
  };

  const login = async (data) => {
    const res = await authService.login(data);
    const { user, accessToken } = res.data.data;
    localStorage.setItem("accessToken", accessToken);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);