import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Home, Bookmark, LogOut, Sparkles } from 'lucide-react';
import { SubscriptionItem } from '../services/api';
import { useStore } from '../store';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [subscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningRooms] = useState<number>(0); // TODO: fetch joined rooms count

  useEffect(() => {
    if (!user?.is_authenticated || user.is_creator) {
      navigate('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, we'd fetch actual subscription data
        // For now, this is a placeholder
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleLogout = () => {
    setUser(null);
    navigate('/auth');
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="relative max-w-4xl mx-auto px-4 md:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">My Profile</h1>
        <p className="text-text-secondary">View your account information and activity</p>
      </motion.div>

      {/* Profile Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-3xl border border-white/10 p-8 mb-8 space-y-6"
      >
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center text-2xl font-bold text-white">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">{user?.username}</h2>
            <p className="text-text-secondary">Member since {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm text-text-secondary">Subscriptions</span>
            </div>
            <p className="text-2xl font-bold text-white">{subscriptions.length}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-5 h-5 text-primary" />
              <span className="text-sm text-text-secondary">Rooms Joined</span>
            </div>
            <p className="text-2xl font-bold text-white">{joiningRooms}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bookmark className="w-5 h-5 text-primary" />
              <span className="text-sm text-text-secondary">Account Type</span>
            </div>
            <p className="text-lg font-bold text-primary">Viewer</p>
          </div>
        </div>
      </motion.div>

      {/* Account Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => navigate('/bookmarks')}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 font-semibold text-white hover:bg-secondary/80 transition"
          >
            <Bookmark className="w-5 h-5" /> Bookmarks
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/50 px-6 py-3 font-semibold text-red-300 hover:border-red-500 hover:text-red-400 transition"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>

        <button
          onClick={() => navigate('/dating/setup')}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-6 py-3 text-primary hover:bg-primary/10 transition"
        >
          <Sparkles className="w-5 h-5" /> Build your Cherry profile
        </button>
      </motion.div>
    </div>
  );
};
