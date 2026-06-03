import { create } from 'zustand';

interface AuthUser {
  id: number;
  username: string;
  is_authenticated: boolean;
  is_creator?: boolean;
  profile?: {
    subscription_price: number;
    allow_direct_messages: boolean;
    show_profile_public: boolean;
    hide_followers: boolean;
    allow_subscriptions: boolean;
    notification_newsletter: boolean;
    bio: string;
    dating_gender?: string;
    dating_age?: number | null;
    dating_location?: string;
    dating_looking_for?: string;
    dating_interests?: string;
    dating_profile_public?: boolean;
    dating_profile_complete?: boolean;
  };
}

interface Store {
  ageVerified: boolean;
  setAgeVerified: (verified: boolean) => void;
  favorites: number[];
  toggleFavorite: (contentId: number) => void;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<Store>((set) => ({
  ageVerified: localStorage.getItem('ageVerified') === 'true',
  setAgeVerified: (verified) => {
    set({ ageVerified: verified });
    localStorage.setItem('ageVerified', verified.toString());
  },
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
  toggleFavorite: (contentId) =>
    set((state) => {
      const favorites = state.favorites.includes(contentId)
        ? state.favorites.filter((id) => id !== contentId)
        : [...state.favorites, contentId];
      localStorage.setItem('favorites', JSON.stringify(favorites));
      return { favorites };
    }),
  user: null,
  setUser: (user) => set({ user }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
