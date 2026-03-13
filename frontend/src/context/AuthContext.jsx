import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const checkLoggedInUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (!ignore) {
          setLoading(false);
        }

        return;
      }

      try {
        const { data } = await api.get("/auth/profile");

        if (!ignore) {
          setUser(data);
        }
      } catch (err) {
        console.log("Profile fetch error:", err);
        localStorage.removeItem("token");

        if (!ignore) {
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    checkLoggedInUser();

    return () => {
      ignore = true;
    };
  }, []);

  const login = (data) => {
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

export default AuthContext;
