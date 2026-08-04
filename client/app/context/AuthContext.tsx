"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getAccessToken, setAccessToken } from "../../lib/api";

export interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): { sub: string; email: string } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(getAccessToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const updateToken = (token: string | null, userData?: User | null) => {
    setAccessToken(token);
    setAccessTokenState(token);
    if (token) {
      if (userData) {
        setUser(userData);
      } else {
        const decoded = parseJwt(token);
        if (decoded) {
          setUser({ id: decoded.sub, email: decoded.email, name: null });
        }
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // Initial silent refresh check on mount
    const checkAuth = async () => {
      try {
        const response = await api.post("/auth/refresh");
        if (response.data?.tokens?.accessToken) {
          updateToken(response.data.tokens.accessToken);
        }
      } catch {
        updateToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { user: userData, tokens } = res.data;
    updateToken(tokens.accessToken, userData);
  };

  const signup = async (email: string, password: string, name?: string) => {
    const res = await api.post("/auth/signup", { email, password, name });
    const { user: userData, tokens } = res.data;
    updateToken(tokens.accessToken, userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors
    } finally {
      updateToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
