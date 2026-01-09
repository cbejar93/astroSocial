import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      loading: false,
      // provide stubs that warn when used without provider
      login: async () => {
        throw new Error('AuthProvider is missing');
      },
      logout: async () => {
        throw new Error('AuthProvider is missing');
      },
      refreshUser: async () => {
        throw new Error('AuthProvider is missing');
      },
      updateFollowedLounge: async () => {
        throw new Error('AuthProvider is missing');
      },
      updateFollowingUser: async () => {
        throw new Error('AuthProvider is missing');
      },
      updateTemperaturePreference: async () => {
        throw new Error('AuthProvider is missing');
      },
      updateAccentPreference: async () => {
        throw new Error('AuthProvider is missing');
      },
    };
  }
  return ctx;
}
