/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchUnreadCount } from '../lib/api';

interface Ctx {
  count: number;
  refresh: () => void;
}

export const NotificationContext = createContext<Ctx | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0);

  const refresh = () => {
    fetchUnreadCount()
      .then(setCount)
      .catch(() => setCount(0));
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ count, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
};

