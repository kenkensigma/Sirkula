"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  role: "farmer" | "factory" | "admin";
  phone?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  requireAuth: (actionDescription?: string) => boolean;
  isAuthModalOpen: boolean;
  authModalActionDescription: string;
  openAuthModal: (actionDescription?: string) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalActionDescription, setAuthModalActionDescription] = useState<string>(
    "melanjutkan aksi ini"
  );

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/me", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setUser({
            id: json.data.id,
            email: json.data.email,
            name: json.data.name,
            role: json.data.role,
            phone: json.data.phone,
          });
          setIsAuthModalOpen(false);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // Ignored
    } finally {
      setUser(null);
      router.push("/");
    }
  }, [router]);

  const openAuthModal = useCallback((actionDescription?: string) => {
    if (actionDescription) {
      setAuthModalActionDescription(actionDescription);
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const requireAuth = useCallback(
    (actionDescription?: string): boolean => {
      if (user) {
        return true;
      }
      openAuthModal(actionDescription);
      return false;
    },
    [user, openAuthModal]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        checkAuth,
        logout,
        requireAuth,
        isAuthModalOpen,
        authModalActionDescription,
        openAuthModal,
        closeAuthModal,
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
