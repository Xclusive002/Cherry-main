import { useEffect } from 'react';
import { LoadingOverlay } from './LoadingOverlay';
import { authAPI } from '../services/api';
import { useStore } from '../store';

export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useStore((state) => state.user);
  const isLoading = useStore((state) => state.isLoading);
  const setUser = useStore((state) => state.setUser);
  const setIsLoading = useStore((state) => state.setIsLoading);

  useEffect(() => {
    if (user !== null || isLoading) {
      return;
    }

    let canceled = false;
    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      if (!canceled) {
        setUser(null);
        setIsLoading(false);
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
        }
      });

    return () => {
      canceled = true;
      clearTimeout(timeoutId);
    };
  }, [user, isLoading, setIsLoading, setUser]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return <>{children}</>;
};
