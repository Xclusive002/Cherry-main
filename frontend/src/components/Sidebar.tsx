import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Flame, Bookmark, Play, Users, Settings, HeartHandshake, X } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Flame, label: 'Trending', path: '/trending' },
  { icon: Play, label: 'Videos', path: '/videos' },
  { icon: Users, label: 'Creators', path: '/creators' },
  { icon: HeartHandshake, label: 'Discover', path: '/dating/discover' },
  { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks' },
  { icon: Users, label: 'Chats', path: '/chats' },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: open ? 0 : -300 }}
        animate={{ x: open ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-14 h-[calc(100vh-56px)] w-72 max-w-[85%] glass border-r border-white/10 z-40 md:static md:z-0 md:translate-x-0 md:w-64 overflow-y-auto"
      >
        <div className="p-6 space-y-2">
          {/* Close Button Mobile */}
          <div className="md:hidden flex justify-end mb-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={onClose}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-text-secondary hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="absolute bottom-6 left-6 right-6">
            <Link to="/settings" onClick={onClose}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-white/5 transition"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
