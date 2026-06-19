import { useEffect, useRef } from 'react';
import { LoadingOverlay } from './LoadingOverlay';
import { authAPI } from '../services/api';
import { useStore } from '../store';

export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoading = useStore((state) => state.isLoading);
  const setUser = useStore((state) => state.setUser);
  const setIsLoading = useStore((state) => state.setIsLoading);
  const setAuthChecked = useStore((state) => state.setAuthChecked);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

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
        setAuthChecked(true);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        if (canceled) return;
        setUser(null);
        setAuthChecked(true);
      })
      .finally(() => {
        if (!canceled) {
          setIsLoading(false);
        }
      });

    return () => {
      canceled = true;
      clearTimeout(timeoutId);
    };
  }, [setIsLoading, setUser, setAuthChecked]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return <>{children}</>;
};
