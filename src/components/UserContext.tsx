"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
  title?: string | null;
  avatar?: string | null;
}

interface UserContextType {
  currentUser: User | null;
  users: User[];
  login: (credentials: { email?: string; userId?: string; password?: string }) => Promise<User>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; password: string; title?: string }) => Promise<User>;
  addUser: (name: string, email: string, title?: string) => Promise<User>;
  refreshSession: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  users: [],
  login: async () => ({ id: "", name: "", email: "" }),
  logout: async () => {},
  register: async () => ({ id: "", name: "", email: "" }),
  addUser: async () => ({ id: "", name: "", email: "" }),
  refreshSession: async () => {},
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    try {
      // 1. Fetch current authenticated session
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.user) {
          setCurrentUser(meData.user);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }

      // 2. Fetch all team members for collaboration and login selectors
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (err) {
      console.error("Failed to load authentication session", err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (credentials: { email?: string; userId?: string; password?: string }): Promise<User> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Login failed");
    }

    const data = await res.json();
    setCurrentUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    router.push("/login");
  };

  const register = async (data: { name: string; email: string; password: string; title?: string }): Promise<User> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to create account");
    }

    const resData = await res.json();
    setCurrentUser(resData.user);
    setUsers((prev) => [...prev, resData.user]);
    return resData.user;
  };

  const addUser = async (name: string, email: string, title?: string): Promise<User> => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, title }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to create user");
    }

    const newUser: User = await res.json();
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        register,
        addUser,
        refreshSession: loadSession,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(UserContext);
}
