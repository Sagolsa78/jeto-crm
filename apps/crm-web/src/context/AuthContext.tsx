"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole, Permission } from "../lib/types";
import { api } from "../lib/api-client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: Permission | string) => boolean;
  isRole: (roles: UserRole | UserRole[]) => boolean;
  canAssignLead: () => boolean;
  canDeleteLead: () => boolean;
  canViewMargins: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check saved session
    const savedToken = localStorage.getItem("jeto_crm_token");
    const savedUser = localStorage.getItem("jeto_crm_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with /auth/me in background
        api.auth
          .me()
          .then((freshUser) => {
            setUser(freshUser);
            localStorage.setItem("jeto_crm_user", JSON.stringify(freshUser));
          })
          .catch(() => {
            // Token expired or invalid
            logout();
          })
          .finally(() => {
            setIsLoading(false);
          });
        return;
      } catch {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem("jeto_crm_token", res.access_token);
      localStorage.setItem("jeto_crm_user", JSON.stringify(res.user));
      router.push("/app");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("jeto_crm_token");
    localStorage.removeItem("jeto_crm_user");
    router.push("/login");
  };

  const can = (permission: Permission | string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.permissions && Array.isArray(user.permissions)) {
      return (user.permissions as string[]).includes(permission);
    }
    // Fallback role rules when user is non-admin
    if (permission === "leads:assign") return user.role === "manager";
    if (permission === "leads:delete") return false;
    if (permission === "quotes:view_margins") return user.role === "manager";
    return true;
  };

  const isRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const list = Array.isArray(roles) ? roles : [roles];
    return list.includes(user.role);
  };

  const canAssignLead = () => can("leads:assign");
  const canDeleteLead = () => can("leads:delete");
  const canViewMargins = () => can("quotes:view_margins");

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        can,
        isRole,
        canAssignLead,
        canDeleteLead,
        canViewMargins,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
