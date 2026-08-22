"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api, setAuthToken, getStoredToken } from "./api";

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: "ADMIN" | "FACULTY" | "STUDENT";
  avatar_url?: string;
  student_profile_id?: number;
  faculty_profile_id?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, pass: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: "ADMIN" | "FACULTY" | "STUDENT") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const storedUser = localStorage.getItem("edutrack_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        const freshUser = await api.auth.me();
        setUser(freshUser);
        localStorage.setItem("edutrack_user", JSON.stringify(freshUser));
      } catch (err) {
        console.error("Auth validation failed:", err);
        setAuthToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (usernameOrEmail: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ username_or_email: usernameOrEmail, password: pass });
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  const switchDemoRole = async (role: "ADMIN" | "FACULTY" | "STUDENT") => {
    setIsLoading(true);
    let email = "admin@edutrack.ai";
    let pass = "Admin@123";
    if (role === "FACULTY") {
      email = "prof.smith@edutrack.ai";
      pass = "Faculty@123";
    } else if (role === "STUDENT") {
      email = "john.doe@edutrack.ai";
      pass = "Student@123";
    }

    try {
      const res = await api.auth.login({ username_or_email: email, password: pass });
      setUser(res.user);
      if (role === "ADMIN") window.location.href = "/admin/dashboard";
      else if (role === "FACULTY") window.location.href = "/faculty/dashboard";
      else window.location.href = "/student/dashboard";
    } catch (err) {
      console.error("Failed demo role switch", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
