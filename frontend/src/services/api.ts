import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const cleanApiUrl = rawApiUrl.replace(/\/+$/, '');
const API_BASE_URL = cleanApiUrl
  ? cleanApiUrl.endsWith('/api')
    ? cleanApiUrl
    : `${cleanApiUrl}/api`
  : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CreatorSummary {
  id: number;
  username: string;
  display_name: string;
  bio: string;
  avatar?: string;
  is_creator: boolean;
  subscription_price: number;
  allow_direct_messages: boolean;
  show_profile_public: boolean;
  hide_followers: boolean;
  allow_subscriptions: boolean;
  notification_newsletter: boolean;
  total_followers: number;
  total_contents: number;
  is_following: boolean;
  is_subscribed: boolean;
}

export interface RoomItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  is_active: boolean;
  member_count: number;
  is_member: boolean;
  creator: { id: number; username: string };
}

export interface ContentItem {
  id: number;
  title: string;
  description: string;
  content_type: 'video' | 'leak' | 'story' | 'image';
  publish_date: string;
  is_published: boolean;
  age_restricted: boolean;
  price: number;
  is_paid: boolean;
  video_file?: string;
  image_file?: string;
  thumbnail?: string;
  story_text?: string;
  source_url?: string;
  private_room_id?: number;
  creator: { id: number; username: string };
  has_purchased: boolean;
}

export interface CreatorDetail {
  creator: CreatorSummary;
  contents: ContentItem[];
  rooms: RoomItem[];
  performance?: {
    total_content_sales: number;
    total_room_sales: number;
    total_earned: number;
  };
}

export interface ProfileSettings {
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
}

export interface AuthUser {
  id: number;
  username: string;
  is_authenticated: boolean;
  is_creator?: boolean;
  profile?: ProfileSettings;
}

export interface SubscriptionItem {
  id: number;
  creator: CreatorSummary;
  price: number;
  subscribed_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  thread_id: number;
  sender: { id: number; username: string };
  text: string;
  created_at: string;
}

export interface ChatThread {
  id: number;
  creator_id: number;
  user_id: number;
  other: { id: number; username: string };
  last_message: ChatMessage | null;
  updated_at: string;
  messages_count: number;
}

export interface DatingProfile {
  id: number;
  username: string;
  display_name: string;
  bio: string;
  age?: number;
  gender?: string;
  location?: string;
  looking_for?: string;
  interests?: string;
  photos: string[];
  profile_public: boolean;
  profile_complete: boolean;
  is_creator: boolean;
  avatar?: string;
  has_liked: boolean;
  has_passed: boolean;
  is_match: boolean;
}

export interface DatingMatchItem {
  id: number;
  matched_at: string;
  user: DatingProfile;
}

export const contentAPI = {
  getAll: (params?: Record<string, any>) => api.get<ContentItem[]>('/content/', { params }).then((res) => res.data),
  getById: (id: number) => api.get<ContentItem>(`/content/${id}/`).then((res) => res.data),
  getByType: (type: 'video' | 'leak' | 'story' | 'image') =>
    api.get<ContentItem[]>('/content/', { params: { type } }).then((res) => res.data),
  getByCreator: (creatorId: number) =>
    api.get<ContentItem[]>('/content/', { params: { creator_id: creatorId } }).then((res) => res.data),
  create: (formData: FormData) => api.post<ContentItem>('/content/', formData).then((res) => res.data),
  purchase: (contentId: number) => api.post(`/purchase/content/${contentId}/`).then((res) => res.data),
};

export const creatorAPI = {
  getAll: () => api.get<CreatorSummary[]>('/creators/').then((res) => res.data),
  getById: (id: number) => api.get<CreatorDetail>(`/creators/${id}/`).then((res) => res.data),
  getMe: () => api.get<CreatorDetail>('/creators/me/').then((res) => res.data),
  follow: (id: number) => api.post(`/creators/${id}/follow/`).then((res) => res.data),
  subscribe: (id: number) => api.post(`/creators/${id}/subscribe/`).then((res) => res.data),
  initializePaystackSubscription: (id: number, amount: number, recurring = true) =>
    api.post(`/paystack/initialize/${id}/`, { amount, recurring }).then((res) => res.data),
};

export const chatAPI = {
  getThreads: () => api.get<ChatThread[]>('/chats/').then((res) => res.data),
  getThread: (id: number) => api.get<{ thread: ChatThread; messages: ChatMessage[] }>(`/chats/${id}/`).then((res) => res.data),
  startChat: (creatorId: number) => api.post('/chats/start/', { creator_id: creatorId }).then((res) => res.data),
  sendMessage: (threadId: number, text: string) => api.post(`/chats/${threadId}/messages/`, { text }).then((res) => res.data),
};

export const notificationAPI = {
  getAll: () => api.get<Notification[]>('/notifications/').then((res) => res.data),
  create: (title: string, message: string) => api.post('/notifications/', { title, message }).then((res) => res.data),
};

export const subscriptionAPI = {
  getAll: () => api.get<SubscriptionItem[]>('/subscriptions/').then((res) => res.data),
};

export const roomAPI = {
  getAll: () => api.get<RoomItem[]>('/rooms/').then((res) => res.data),
  getById: (roomId: number) => api.get<RoomItem>(`/rooms/${roomId}/`).then((res) => res.data),
  create: (payload: { title: string; description: string; price: number; is_active: boolean }) =>
    api.post<RoomItem>('/rooms/', payload).then((res) => res.data),
  join: (roomId: number) => api.post(`/rooms/${roomId}/join/`).then((res) => res.data),
};

export const datingAPI = {
  discover: (params?: Record<string, any>) => api.get<DatingProfile[]>('/dating/discover/', { params }).then((res) => res.data),
  getProfile: (id: number) => api.get<DatingProfile>(`/dating/profile/${id}/`).then((res) => res.data),
  updateProfile: (formData: FormData) => api.post('/dating/profile/update/', formData).then((res) => res.data),
  swipe: (targetId: number, direction: 'like' | 'pass') => api.post('/dating/swipe/', { target_id: targetId, direction }).then((res) => res.data),
  getMatches: () => api.get<DatingMatchItem[]>('/dating/matches/').then((res) => res.data),
};

export const authAPI = {
  getCurrentUser: () => api.get<AuthUser>('/auth/user/').then((res) => res.data),
  login: (username: string, password: string) =>
    api.post('/auth/login/', { username, password }).then((res) => res.data),
  register: (
    username: string,
    password: string,
    email?: string,
    is_creator?: boolean,
    bio?: string,
    subscription_price?: number,
    agree_terms?: boolean,
  ) =>
    api
      .post('/auth/register/', { username, password, email, is_creator, bio, subscription_price, agree_terms })
      .then((res) => res.data),
  logout: () => api.post('/auth/logout/').then((res) => res.data),
  updateSettings: (settings: Partial<ProfileSettings>) =>
    api.post('/auth/settings/', settings).then((res) => res.data),
};

export default api;
