import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, Lock } from 'lucide-react';
import { ContentItem } from '../services/api';
import { useStore } from '../store';
import { Link } from 'react-router-dom';

interface ContentCardProps {
  item: ContentItem;
  index?: number;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item, index = 0 }) => {
  const { favorites, toggleFavorite } = useStore();
  const isFavorited = favorites.includes(item.id);
  const isLocked = item.is_paid && !item.has_purchased;

  const badgeColor = {
    video: 'bg-blue-500/20 text-blue-300',
    leak: 'bg-red-500/20 text-red-300',
    story: 'bg-purple-500/20 text-purple-300',
    image: 'bg-emerald-500/20 text-emerald-300',
  }[item.content_type];

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `₦${price.toFixed(2)}`;
  };

  return (
    <Link to={`/content/${item.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -8 }}
        className="group cursor-pointer"
      >
        <div className="relative bg-secondary rounded-xl overflow-hidden mb-3">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-tertiary overflow-hidden">
            {item.thumbnail ? (
              <motion.img
                src={item.thumbnail}
                alt={item.title}
                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                  isLocked ? 'blur-sm' : ''
                }`}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-pink-600/30 flex items-center justify-center">
                <Play className="w-12 h-12 text-white/30" />
              </div>
            )}

            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80"
              >
                <Play className="w-5 h-5 ml-1 fill-white" />
              </motion.button>
            </motion.div>

            {/* Badge */}
            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${badgeColor}`}>
              {item.content_type.toUpperCase()}
            </div>

            {/* Locked Badge for Paid Content */}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/70 p-3 rounded-full">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
              </div>
            )}

            {/* Heart Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(item.id);
              }}
              className="absolute bottom-2 right-2 p-2 bg-black/60 rounded-full hover:bg-primary transition"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorited ? 'fill-primary text-primary' : 'text-white'
                }`}
              />
            </motion.button>
          </div>

          {/* Info */}
          <div className="p-3">
            <h3 className="font-semibold text-white line-clamp-2 group-hover:text-primary transition">
              {item.title}
            </h3>
            <p className="text-sm text-text-secondary mt-1 line-clamp-1">
              {item.description || 'No description'}
            </p>
            <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
              <span>{new Date(item.publish_date).toLocaleDateString()}</span>
              <span>{formatPrice(item.price)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
