import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Info } from 'lucide-react';
import { ContentItem, contentAPI, DatingProfile, datingAPI } from '../services/api';
import { CardSkeleton } from '../components/Skeletons';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const HomePage = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [featured, setFeatured] = useState<ContentItem | null>(null);
  const [profiles, setProfiles] = useState<DatingProfile[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await contentAPI.getAll();
        if (Array.isArray(data)) {
          setContents(data);
          if (data.length > 0) {
            setFeatured(data[0]);
          }
        } else {
          console.error('Unexpected content API response, expected array:', data);
          setContents([]);
        }
      } catch (error) {
        console.error('Failed to fetch content:', error);
        setContents([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfiles = async () => {
      try {
        const items = await datingAPI.discover();
        if (Array.isArray(items)) {
          setProfiles(items);
        } else {
          console.error('Unexpected dating API response, expected array:', items);
          setProfiles([]);
        }
      } catch (err) {
        console.error('Failed to fetch profiles:', err);
        setProfiles([]);
      }
    };

    // fetch featured items for the hero/carousel
    const fetchFeatured = async () => {
      try {
        const data = await contentAPI.getAll({ home: 1 });
        if (Array.isArray(data) && data.length > 0) setFeatured(data[0]);
        else if (!Array.isArray(data)) {
          console.error('Unexpected featured content API response, expected array:', data);
        }
      } catch (err) {
        console.error('Failed to fetch featured content:', err);
      }
    };

    fetchData();
    fetchFeatured();
    fetchProfiles();

    // Auto-rotate carousel
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % Math.max(contents.length, 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [contents.length]);

  const carousel = contents.slice(0, 5);

  return (
    <div className="relative min-h-screen">
      {loading && <LoadingOverlay />}
      {/* Hero/Carousel Section */}
      {featured && carousel.length > 0 && (
        <div className="relative h-96 md:h-screen overflow-hidden mb-12">
          <motion.div
            key={carousel[carouselIndex]?.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {carousel[carouselIndex]?.thumbnail && (
              <img
                src={carousel[carouselIndex].thumbnail}
                alt="Featured"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-black/50 to-transparent" />
          </motion.div>

          {/* Hero Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl md:text-6xl font-bold text-white mb-4 max-w-2xl">
                {carousel[carouselIndex]?.title}
              </h1>
              <p className="text-text-secondary text-lg mb-8 max-w-xl line-clamp-2">
                {carousel[carouselIndex]?.description}
              </p>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/80 transition"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Watch Now
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 border border-white/20 px-8 py-3 rounded-lg font-semibold hover:bg-white/5 transition"
                >
                  <Info className="w-5 h-5" />
                  Info
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Carousel Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {carousel.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCarouselIndex(i)}
                className={`h-1 rounded-full transition ${
                  i === carouselIndex ? 'bg-primary w-8' : 'bg-white/30 w-2'
                }`}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>

          {/* Arrow Controls */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() =>
              setCarouselIndex((prev) => (prev - 1 + carousel.length) % carousel.length)
            }
            className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black/60 rounded-full hover:bg-black/80 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => setCarouselIndex((prev) => (prev + 1) % carousel.length)}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black/60 rounded-full hover:bg-black/80 transition"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>
      )}

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-8">People on Cherry</h2>
          {loading ? (
            <CardSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {profiles.map((p) => (
                <div key={p.id} className="glass rounded-3xl border border-white/10 p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#111827] rounded-lg overflow-hidden">
                      {p.avatar ? <img src={p.avatar} alt={p.display_name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{p.display_name}</h3>
                      <p className="text-text-secondary">@{p.username} • {p.age || '—'}</p>
                      <p className="text-text-secondary text-sm mt-2">{p.location}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => window.location.assign(`/dating/profile/${p.id}`)} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition">View profile</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
