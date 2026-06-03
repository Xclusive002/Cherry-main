import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Star, MessageCircle, DollarSign, Search } from 'lucide-react';
import { CreatorSummary, creatorAPI, chatAPI } from '../services/api';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { CardSkeleton } from '../components/Skeletons';

export const CreatorsPage: React.FC = () => {
  const [creators, setCreators] = useState<CreatorSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'followers' | 'price' | 'recent'>('followers');
  const [loading, setLoading] = useState(true);
  const [chatStarting, setChatStarting] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        const data = await creatorAPI.getAll();
        setCreators(data);
      } catch (error) {
        console.error('Failed to load creators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  const filteredCreators = useMemo(() => {
    let items = creators.filter((creator) =>
      creator.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.bio.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (sortOption === 'followers') {
      items = items.slice().sort((a, b) => b.total_followers - a.total_followers);
    } else if (sortOption === 'price') {
      items = items.slice().sort((a, b) => a.subscription_price - b.subscription_price);
    } else if (sortOption === 'recent') {
      items = items.slice().sort((a, b) => b.total_contents - a.total_contents);
    }

    return items;
  }, [creators, searchQuery, sortOption]);

  const handleStartChat = async (creatorId: number) => {
    setChatStarting(creatorId);
    try {
      await chatAPI.startChat(creatorId);
      navigate('/chats');
    } catch (error) {
      console.error('Unable to start chat', error);
    } finally {
      setChatStarting(null);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      {loading && <LoadingOverlay />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Creators</h1>
        <p className="text-text-secondary">Browse registered creators and discover premium content.</p>
      </motion.div>

      <div className="glass rounded-3xl border border-white/10 p-5 mb-8 grid gap-4 md:grid-cols-[1fr_220px] items-center">
        <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-text-secondary">
          <Search className="w-5 h-5 text-primary" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creators by name, username, or bio"
            className="w-full bg-transparent outline-none text-white placeholder:text-text-secondary"
          />
        </label>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as any)}
          className="rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none"
        >
          <option value="followers">Sort by followers</option>
          <option value="price">Sort by price</option>
          <option value="recent">Sort by recent activity</option>
        </select>
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {filteredCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-3xl border border-white/10 p-6 space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center text-xl font-bold text-white">
                  {creator.display_name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{creator.display_name}</h2>
                  <p className="text-text-secondary">@{creator.username}</p>
                </div>
              </div>
              <p className="text-text-secondary leading-relaxed">{creator.bio || 'Creator building premium content on the site.'}</p>
              <div className="grid gap-3 text-sm text-text-secondary">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" /> Followers
                  </span>
                  <span>{creator.total_followers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Published
                  </span>
                  <span>{creator.total_contents}</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-white/5 px-3 py-2 text-sm text-text-secondary">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" /> Sub price
                  </span>
                  <span>₦{creator.subscription_price.toFixed(2)}/mo</span>
                </div>
              </div>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => handleStartChat(creator.id)}
                  disabled={chatStarting !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-secondary/80 px-4 py-3 text-sm font-semibold text-white hover:border-primary hover:text-primary transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chatStarting === creator.id ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Starting chat…
                    </span>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" /> Message
                    </>
                  )}
                </button>
                <Link
                  to={`/creators/${creator.id}`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary/90 transition"
                >
                  View Creator
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};