import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CardSkeleton } from '../components/Skeletons';
import { ContentCard } from '../components/ContentCard';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ContentItem, contentAPI } from '../services/api';

export const TrendingPage: React.FC = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedType, setSelectedType] = useState<'video' | 'leak' | 'story' | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let data: ContentItem[];
        if (selectedType === 'all') {
          data = await contentAPI.getAll();
        } else {
          data = await contentAPI.getByType(selectedType);
        }
        setContents(data);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedType]);

  const types = [
    { value: 'all', label: 'All Content' },
    { value: 'video', label: 'Videos' },
    { value: 'leak', label: 'Leaks' },
    { value: 'story', label: 'Stories' },
  ];

  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      {loading && <LoadingOverlay />}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Trending Now</h1>
        <p className="text-text-secondary mb-8">Most popular content this week</p>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-12 overflow-x-auto pb-2">
        {types.map((type) => (
          <motion.button
            key={type.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedType(type.value as any)}
            className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              selectedType === type.value
                ? 'bg-primary text-white'
                : 'border border-white/20 text-text-secondary hover:border-white/40'
            }`}
          >
            {type.label}
          </motion.button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <CardSkeleton count={8} />
      ) : contents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {contents.map((item, index) => (
            <ContentCard key={item.id} item={item} index={index} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-text-secondary text-lg">No content found</p>
        </motion.div>
      )}
    </div>
  );
};
