import React, { useEffect, useMemo, useState } from 'react';
import { Search, ArrowDownUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContentCard } from '../components/ContentCard';
import { CardSkeleton } from '../components/Skeletons';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ContentItem, contentAPI } from '../services/api';

export const VideosPage: React.FC = () => {
  const [videos, setVideos] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price'>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const data = await contentAPI.getByType('video');
        setVideos(data);
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const filteredVideos = useMemo(() => {
    let items = videos.filter((video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (sortBy === 'price') {
      items = items.slice().sort((a, b) => a.price - b.price);
    } else {
      items = items.slice().sort((a, b) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime());
    }

    return items;
  }, [videos, searchQuery, sortBy]);

  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      {loading && <LoadingOverlay />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Videos</h1>
        <p className="text-text-secondary">Browse all published video content.</p>
      </motion.div>

      <div className="glass rounded-3xl border border-white/10 p-5 mb-8 grid gap-4 md:grid-cols-[1fr_220px] items-center">
        <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-text-secondary">
          <Search className="w-5 h-5 text-primary" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by title or description"
            className="w-full bg-transparent outline-none text-white placeholder:text-text-secondary"
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Sort videos</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 pr-10 text-white outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="price">Price low to high</option>
          </select>
          <ArrowDownUp className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
        </label>
      </div>

      {loading ? (
        <CardSkeleton count={8} />
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredVideos.map((item, index) => (
            <ContentCard key={item.id} item={item} index={index} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <p className="text-text-secondary">No video content is available right now.</p>
        </motion.div>
      )}
    </div>
  );
};