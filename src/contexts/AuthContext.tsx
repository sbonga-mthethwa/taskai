import { createContext, useContext, useState, useCallback, useEffect, ReactNode, forwardRef } from "react";
import {
  cognitoLogin,
  cognitoSignup,
  cognitoLogout,
  cognitoForgotPassword,
  cognitoGetCurrentSession,
  clearTokens,
  getIdTokenPayload,
} from "@/services/cognitoAuth";
import { fetchCurrentUser, type ApiUser } from "@/services/api";

export interface AppUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  avatarType?: string;
  employeeNumber?: string;
  department?: string;
  surname?: string;
  contactNumber?: string;
  username?: string;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: SignupData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (updates: Partial<AppUser>) => void;
  refreshUser: () => Promise<AppUser | null>;
}

interface SignupData {
  name: string;
  surname: string;
  email: string;
  contactNumber: string;
  username: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapApiUser = (u: ApiUser): AppUser => {
  const resolvedUserId = u.userId || u.id || "";
  // Fall back to Cognito ID token email when backend doesn't return it
  const cognitoEmail = getIdTokenPayload()?.email || "";
  return {
    id: resolvedUserId,
    userId: resolvedUserId,
    name: u.name || "",
    email: u.email || cognitoEmail || "",
    avatarUrl: u.avatarUrl || u.avatar || undefined,
    avatarType: u.avatarType || undefined,
    department: u.department || undefined,
    employeeNumber: u.employeeNumber || undefined,
    contactNumber: u.contactNumber || u.phone || undefined,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const apiUser = await fetchCurrentUser();
    const mappedUser = mapApiUser(apiUser);
    setUser(mappedUser);
    return mappedUser;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const session = await cognitoGetCurrentSession();
        if (session) {
          await refreshUser();
        }
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await cognitoLogin(email, password);
      await refreshUser();
    } catch (err) {
      clearTokens();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    try {
      await cognitoSignup({
        email: data.email,
        password: data.password,
        name: data.name,
        surname: data.surname,
        contactNumber: data.contactNumber,
        username: data.username,
      });
      try {
        await cognitoLogin(data.email, data.password);
        await refreshUser();
      } catch {
        // Auto-login failed (likely needs email confirmation)
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const logout = useCallback(() => {
    cognitoLogout();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await cognitoForgotPassword(email);
  }, []);

  const updateUser = useCallback((updates: Partial<AppUser>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        signup,
        resetPassword,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const AUTH_FALLBACK: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => { throw new Error("AuthProvider not mounted"); },
  logout: () => {},
  signup: async () => { throw new Error("AuthProvider not mounted"); },
  resetPassword: async () => { throw new Error("AuthProvider not mounted"); },
  updateUser: () => {},
  refreshUser: async () => null,
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  return ctx ?? AUTH_FALLBACK;
};