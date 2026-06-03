import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertCircle } from 'lucide-react';
import { Notification, notificationAPI } from '../services/api';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let source: EventSource | null = null;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await notificationAPI.getAll();
        setNotifications(data);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        setError('Unable to load notifications right now.');
      } finally {
        setLoading(false);
      }
    };

    const connectStream = () => {
      source = new EventSource('/api/notifications/stream/');

      source.addEventListener('notification', (event) => {
        try {
          const notification = JSON.parse(event.data) as Notification;
          setNotifications((prev) => [notification, ...prev]);
          setError(null);
        } catch (err) {
          console.error('Failed to parse real-time notification:', err);
        }
      });

      source.onopen = () => {
        setError(null);
      };

      source.onerror = () => {
        setError('Real-time notifications are currently unavailable. Retrying...');
      };
    };

    fetchNotifications();
    connectStream();

    return () => {
      if (source) source.close();
    };
  }, []);

  if (loading) return <LoadingOverlay />;

  return (
    <div className="relative max-w-4xl mx-auto px-4 md:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Notifications</h1>
        </div>
        <p className="text-text-secondary">Stay updated with announcements from the platform</p>
      </motion.div>

      {error && (
        <div className="glass rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100 mb-4">
          {error}
        </div>
      )}
      {notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl border border-white/10 p-12 text-center"
        >
          <AlertCircle className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-semibold text-white mb-2">No notifications yet</h2>
          <p className="text-text-secondary">Check back later for platform announcements and updates</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-2xl border border-white/10 p-6 hover:border-primary/50 transition"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/20">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {notification.title}
                  </h3>
                  <p className="text-text-secondary mb-2 leading-relaxed">
                    {notification.message}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
