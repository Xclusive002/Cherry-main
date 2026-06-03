import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, HeartHandshake } from 'lucide-react';
import { DatingMatchItem, datingAPI } from '../services/api';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const DatingMatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<DatingMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadMatches = async () => {
    setLoading(true);
    try {
      const items = await datingAPI.getMatches();
      setMatches(items);
      if (!items.length) {
        setMessage('No matches yet. Swipe right to find someone new.');
      }
    } catch (error) {
      console.error('Failed to load matches', error);
      setMessage('Unable to load your matches at the moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  return (
    <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-12">
      {loading && <LoadingOverlay />}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Cherry Matches</h1>
        <p className="text-text-secondary mt-2">Review your mutual matches and start chatting with the people who liked you back.</p>
      </motion.div>

      {message && (
        <div className="glass rounded-3xl border border-white/10 p-5 text-sm text-white mb-6">
          {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {matches.map((match) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass rounded-3xl border border-white/10 p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">{match.user.display_name}</h2>
                <p className="text-text-secondary">{match.user.location || 'Location not set'}</p>
              </div>
              <HeartHandshake className="w-6 h-6 text-primary" />
            </div>

            <p className="text-text-secondary mt-4 leading-relaxed">{match.user.bio || 'No biography available.'}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {match.user.interests?.split(',').map((interest) => (
                <span key={interest} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-text-secondary">
                  {interest.trim()}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => navigate('/chats')}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-5 py-3 text-white font-semibold hover:bg-primary/90 transition"
              >
                <MessageCircle className="w-4 h-4" /> Open Chats
              </button>
              <button
                onClick={() => navigate(`/dating/profile/${match.user.id}`)}
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10 transition"
              >
                View profile
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
