import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Search, Bell, User } from 'lucide-react';
import { useStore } from '../store';

interface NavbarProps {
  onMenuToggle: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const user = useStore((state) => state.user);
  const isLoading = useStore((state) => state.isLoading);
  const navigate = useNavigate();
  
  const profileLink = user?.is_creator ? '/profile' : user ? '/user-profile' : isLoading ? '/' : '/auth';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-40 glass border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/cherry.svg" alt="Cherry" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            <span className="hidden sm:inline font-bold text-lg text-[#bb1f40]">Cherry</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 md:mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type="text"
                placeholder="Search content..."
                className="w-full bg-secondary/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => navigate('/notifications')}
              className="relative p-2 hover:bg-white/5 rounded-lg transition cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </motion.button>

            {user ? (
              <Link
                to={profileLink}
                className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
              >
                <User className="w-4 h-4" />
                {user.username}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="hidden md:inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20 transition"
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onMenuToggle(true)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
