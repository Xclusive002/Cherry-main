import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share, Download } from 'lucide-react';
import { ContentItem, contentAPI } from '../services/api';
import { useStore } from '../store';
import { SkeletonLoader } from '../components/Skeletons';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const WatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useStore();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isFavorited = content ? favorites.includes(content.id) : false;
  const canAccess = content ? !content.is_paid || content.has_purchased : false;

  const handlePurchase = async () => {
    if (!content) return;
    setActionLoading(true);
    try {
      const response = await contentAPI.purchase(content.id);
      setMessage(response.message || 'Purchase successful. Refresh to view content.');
      const refreshed = await contentAPI.getById(content.id);
      setContent(refreshed);
    } catch (error) {
      console.error('Purchase failed', error);
      setMessage('Unable to complete purchase. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchContent = async () => {
      try {
        const data = await contentAPI.getById(parseInt(id, 10));
        setContent(data);
      } catch (error) {
        console.error('Failed to fetch content:', error);
        setMessage('Unable to load this content right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  if (loading) {
    return (
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <LoadingOverlay />
        <SkeletonLoader />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-text-secondary">Content not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Back Button */}
      <div className="sticky top-16 z-20 glass border-b border-white/10 px-4 py-4">
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {message && (
          <div className="mb-6 rounded-3xl border border-white/10 bg-secondary/70 p-4 text-sm text-white">
            {message}
          </div>
        )}
        {/* Player Container */}
        {content.is_paid && !canAccess ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl overflow-hidden bg-black"
          >
            <div className="flex h-96 items-center justify-center bg-[#111827] px-6 py-8 text-center">
              <div>
                <p className="text-primary text-sm uppercase tracking-[0.3em] mb-3">Premium content</p>
                <h2 className="text-3xl font-bold mb-4">Unlock this video</h2>
                <p className="text-text-secondary mb-6">This content is only available to subscribers or users who have purchased access.</p>
                {content.price > 0 ? (
                  <button
                    onClick={handlePurchase}
                    disabled={actionLoading}
                    className="rounded-3xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading ? 'Processing purchase…' : `Buy for ₦${content.price.toFixed(2)}`}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/creators')}
                    className="rounded-3xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 transition"
                  >
                    Explore creators
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          content.content_type === 'video' && content.video_file && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-2xl overflow-hidden bg-black"
            >
              <video
                controls
                className="w-full aspect-video"
                poster={content.thumbnail || undefined}
              >
                <source src={content.video_file} type="video/mp4" />
              </video>
            </motion.div>
          )
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-6 border border-white/10"
            >
              <h1 className="text-3xl font-bold mb-4">{content.title}</h1>

              {/* Actions */}
              <div className="flex gap-3 mb-6 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => content && toggleFavorite(content.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    isFavorited
                      ? 'bg-primary text-white'
                      : 'border border-white/20 text-text-secondary hover:border-primary/50'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-white' : ''}`} />
                  Favorite
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg text-text-secondary hover:border-white/40 transition"
                >
                  <Share className="w-5 h-5" />
                  Share
                </motion.button>
                {content.video_file && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg text-text-secondary hover:border-white/40 transition"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </motion.button>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-4 border-t border-white/10 pt-6">
                <div>
                  <p className="text-text-secondary text-sm">Type</p>
                  <p className="text-white font-semibold capitalize">
                    {content.content_type}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Published</p>
                  <p className="text-white font-semibold">
                    {new Date(content.publish_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {content.description && (
                  <div>
                    <p className="text-text-secondary text-sm">Description</p>
                    <p className="text-white leading-relaxed">{content.description}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Story Content */}
            {content.content_type === 'story' && content.story_text && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-xl p-8 border border-white/10 mt-8 prose prose-invert max-w-none"
              >
                <div className="whitespace-pre-wrap text-text-secondary leading-relaxed">
                  {content.story_text}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6 border border-white/10 h-fit"
          >
            <h3 className="text-lg font-bold mb-4">Recommended</h3>
            <p className="text-text-secondary text-sm">More recommendations coming soon</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
