import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TelegramUser } from '../types/telegram';

interface User {
  id: string;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  created_at: string;
  last_login: string;
}

interface AuthState {
  user: User | null;
  telegramUser: TelegramUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; telegramUser: TelegramUser } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'LOGOUT' };

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: () => Promise<void>;
  logout: () => void;
} | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        telegramUser: action.payload.telegramUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        telegramUser: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        telegramUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    telegramUser: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  const login = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Mock user for development
      const mockUser = {
        id: '123456789',
        telegram_id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };
      
      const mockTelegramUser = {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser'
      };

      dispatch({ 
        type: 'SET_USER', 
        payload: { user: mockUser, telegramUser: mockTelegramUser } 
      });
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Произошла ошибка при авторизации' 
      });
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Auto-login for development
  useEffect(() => {
    login();
  }, []);

  return (
    <AuthContext.Provider value={{ state, dispatch, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}