import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, X, Sparkles } from 'lucide-react';
import { DatingProfile, datingAPI } from '../services/api';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useStore } from '../store';

export const DatingDiscoverPage: React.FC = () => {
  const [profiles, setProfiles] = useState<DatingProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useStore((state) => state.user);
  const isLoading = useStore((state) => state.isLoading);
  const authChecked = useStore((state) => state.authChecked);
  const navigate = useNavigate();

  const loadProfiles = async () => {
    try {
      const items = await datingAPI.discover();
      setProfiles(items);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to load dating profiles', error);
      setMessage('Unable to load matches right now. Please try again later.');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (!authChecked || isLoading) {
          return;
        }
        if (!user?.is_authenticated) {
          navigate('/auth');
          return;
        }
        await loadProfiles();
      } catch (error) {
        console.error('Unexpected error loading discover page', error);
        setMessage('Unable to load the page right now. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, isLoading, authChecked, navigate]);

  const currentProfile = profiles[currentIndex];

  const handleSwipe = async (direction: 'like' | 'pass') => {
    if (!currentProfile) return;
    setLoading(true);
    setMessage(null);

    try {
      const result = await datingAPI.swipe(currentProfile.id, direction);
      if (result.matched) {
        setMessage(`It's a match with ${currentProfile.display_name}! Open Chats to send a message.`);
      }
      const nextIndex = currentIndex + 1;
      if (nextIndex < profiles.length) {
        setCurrentIndex(nextIndex);
      } else {
        const nextProfiles = await datingAPI.discover();
        setProfiles(nextProfiles);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Swipe failed', error);
      setMessage('Unable to register your choice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-12">
      {loading && <LoadingOverlay />}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Cherry Discover</h1>
        <p className="text-text-secondary mt-2">Swipe through active Cherry profiles and connect with matches in your area.</p>
      </motion.div>

      {message && (
        <div className="glass rounded-3xl border border-white/10 p-4 text-sm text-white mb-6">
          {message}
        </div>
      )}

      {!currentProfile ? (
        <div className="glass rounded-3xl border border-white/10 p-10 text-center">
          <Sparkles className="mx-auto mb-4 w-10 h-10 text-primary" />
          <h2 className="text-2xl font-semibold mb-2">No new profiles found</h2>
          <p className="text-text-secondary mb-6">Create or update your dating profile to see more matches.</p>
          <button
            onClick={() => navigate('/dating/setup')}
            className="inline-flex items-center gap-2 rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition"
          >
            Complete your profile
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-white/10 p-6"
          >
            <div className="grid gap-4">
              <div className="relative rounded-3xl overflow-hidden bg-black/20 min-h-[420px]">
                {currentProfile.photos.length > 0 ? (
                  <img
                    src={currentProfile.photos[0]}
                    alt={currentProfile.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-text-secondary">No photo available</div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h2 className="text-3xl font-bold text-white">{currentProfile.display_name}, {currentProfile.age}</h2>
                  <p className="text-text-secondary mt-1">{currentProfile.location}</p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-3xl border border-white/10 bg-secondary/70 p-5">
                  <h3 className="text-lg font-semibold">About</h3>
                  <p className="text-text-secondary mt-3 whitespace-pre-wrap">{currentProfile.bio || 'No bio provided yet.'}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-secondary/70 p-5">
                  <h3 className="text-lg font-semibold">Looking for</h3>
                  <p className="text-text-secondary mt-3">{currentProfile.looking_for || 'Not specified'}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-secondary/70 p-5">
                  <h3 className="text-lg font-semibold">Interests</h3>
                  <p className="text-text-secondary mt-3">{currentProfile.interests || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass rounded-3xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold">Profile snapshot</h3>
                <div className="mt-4 grid gap-4">
                <div className="rounded-3xl bg-[#111827] p-5">
                  <p className="text-sm text-text-secondary">Gender</p>
                  <p className="mt-2 text-lg font-semibold text-white">{currentProfile.gender || 'Not indicated'}</p>
                </div>
                <div className="rounded-3xl bg-[#111827] p-5">
                  <p className="text-sm text-text-secondary">Public profile</p>
                  <p className="mt-2 text-lg font-semibold text-white">{currentProfile.profile_public ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-3xl bg-[#111827] p-5">
                  <p className="text-sm text-text-secondary">Match status</p>
                  <p className="mt-2 text-lg font-semibold text-white">{currentProfile.is_match ? 'Matched' : 'Waiting'}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl border border-white/10 p-6 space-y-4">
              <button
                onClick={() => handleSwipe('like')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-6 py-4 text-white font-semibold hover:bg-primary/90 transition"
              >
                <Heart className="w-5 h-5" /> Like
              </button>
              <button
                onClick={() => handleSwipe('pass')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" /> Pass
              </button>
            </div>

            <div className="glass rounded-3xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold">Need a better match?</h3>
              <p className="text-text-secondary mt-3">Update your Cherry profile and preferences to see more compatible profiles.</p>
              <button
                onClick={() => navigate('/dating/setup')}
                className="mt-4 inline-flex items-center gap-2 rounded-3xl border border-primary px-5 py-3 text-primary hover:bg-primary/10 transition"
              >
                Update profile
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
