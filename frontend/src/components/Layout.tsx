import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Navbar onMenuToggle={setSidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block md:w-72 w-64">
          <Sidebar open={true} onClose={() => {}} />
        </div>
        <div className="md:hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
        >
          <div className="max-w-4xl mx-auto w-full">{children}</div>
        </motion.main>
      </div>
    </div>
  );
};
