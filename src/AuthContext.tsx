import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, clearToken, setToken } from './api';

export type Role = 'producer' | 'distributor' | 'regulator' | 'consumer';

export interface UserProfile {
  uid: string;
  role: Role;
  name: string;
  email: string;
  phoneNumber?: string;
  companyName?: string;
  companyPrefix?: string;
  documentsVerified: boolean;
  twoFactorEnabled: boolean;
  walletAddress?: string;
  address?: string;
  avatar?: string;
  createdAt: any;
}

export interface AuthUser {
  uid: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  setProfile: (profile: UserProfile) => void;
  login: (token: string, profile: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  setProfile: () => {},
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth.me()
      .then((data: UserProfile) => {
        setProfile(data);
        setUser({ uid: data.uid, email: data.email });
      })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, profileData: UserProfile) => {
    setToken(token);
    setProfile(profileData);
    setUser({ uid: profileData.uid, email: profileData.email });
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
