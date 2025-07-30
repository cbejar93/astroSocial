import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchUnreadCount } from '../lib/api';

interface Ctx {
  count: number;
  refresh: () => void;
}

const NotificationContext = createContext<Ctx | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0);

  const refresh = () => {
    fetchUnreadCount()
      .then(setCount)
      .catch(() => setCount(0));
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <NotificationContext.Provider value={{ count, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
