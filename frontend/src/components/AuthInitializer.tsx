import { useEffect, useState } from 'react';
import { LoadingOverlay } from './LoadingOverlay';
import { authAPI } from '../services/api';
import { useStore } from '../store';

export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoading = useStore((state) => state.isLoading);
  const setUser = useStore((state) => state.setUser);
  const setIsLoading = useStore((state) => state.setIsLoading);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (authChecked || isLoading) {
      return;
    }

    let canceled = false;
    setIsLoading(true);

    const timeoutId = window.setTimeout(() => {
      if (!canceled) {
        setUser(null);
        setIsLoading(false);
        setAuthChecked(true);
      }
    }, 5000);

    authAPI
      .getCurrentUser()
      .then((currentUser) => {
        clearTimeout(timeoutId);
        if (canceled) return;
        setUser(currentUser.is_authenticated ? currentUser : null);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        if (canceled) return;
        setUser(null);
      })
      .finally(() => {
        if (!canceled) {
          setIsLoading(false);
          setAuthChecked(true);
        }
      });

    return () => {
      canceled = true;
      clearTimeout(timeoutId);
    };
  }, [authChecked, isLoading, setIsLoading, setUser]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return <>{children}</>;
};
