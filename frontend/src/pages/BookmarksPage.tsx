import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, TrendingUp } from 'lucide-react';
import { useStore } from '../store';
import { ContentItem, contentAPI } from '../services/api';
import { ContentCard } from '../components/ContentCard';
import { CardSkeleton } from '../components/Skeletons';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const BookmarksPage: React.FC = () => {
  const favorites = useStore((state) => state.favorites);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const [favoriteContent, setFavoriteContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const allContent = await contentAPI.getAll();
        setFavoriteContent(allContent.filter((item) => favorites.includes(item.id)));
      } catch (error) {
        console.error('Failed to fetch bookmarked content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [favorites]);

  const stats = [
    { icon: Heart, label: 'Bookmarks', value: `${favoriteContent.length}` },
    { icon: Eye, label: 'Video Favorites', value: `${favoriteContent.filter((item) => item.content_type === 'video').length}` },
    { icon: TrendingUp, label: 'Stories Saved', value: `${favoriteContent.filter((item) => item.content_type === 'story').length}` },
  ];

  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      {loading && <LoadingOverlay />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">My Bookmarks</h1>
        <p className="text-text-secondary mb-12">Saved content and favorites in one place.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-text-secondary text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <Icon className="w-12 h-12 text-primary/30" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : favoriteContent.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favoriteContent.map((item, index) => (
            <div key={item.id} className="relative">
              <ContentCard item={item} index={index} />
              <button
                type="button"
                onClick={() => toggleFavorite(item.id)}
                className="absolute top-3 right-3 rounded-full bg-black/70 px-3 py-2 text-xs font-semibold text-white hover:bg-primary transition"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/10 rounded-xl p-12 text-center"
        >
          <Heart className="w-16 h-16 text-primary/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No bookmarks yet</h2>
          <p className="text-text-secondary mb-6">Tap the heart on content cards to save your favorite items.</p>
          <Link
            to="/trending"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 transition"
          >
            Explore Trending
          </Link>
        </motion.div>
      )}
    </div>
  );
};
