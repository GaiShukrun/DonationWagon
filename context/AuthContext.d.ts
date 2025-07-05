import { ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  userType: string;
  profileImage?: string;
  [key: string]: any; // For any additional properties
}

export interface AuthContextType {
  user: User | null;
  isUserLoggedIn: boolean;
  login: (credentials: { username: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  requireAuth: (
    callback?: () => void, 
    message?: string,
    destination?: string | null,
    params?: Record<string, any> | null
  ) => boolean;
  requestPasswordReset: (username: string) => Promise<any>;
  verifySecurityQuestion: (username: string, answer: string) => Promise<any>;
  signUp: (userData: any) => Promise<any>;
  updateProfileImage: (imageUri: string) => Promise<any>;
}

export const AuthContext: React.Context<AuthContextType>;

export function useAuth(): AuthContextType;

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider(props: AuthProviderProps): JSX.Element;
