import React from 'react';
import { motion } from 'framer-motion';

interface AgeGateProps {
  onVerify: () => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({ onVerify }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-12 max-w-md mx-4 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-primary to-pink-600 rounded-full"
        />
        <h1 className="text-3xl font-bold mb-4 text-white">Age Verification Required</h1>
        <p className="text-text-secondary mb-8">
          This site contains adult content. You must be 18 years or older to continue.
        </p>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onVerify}
            className="flex-1 bg-gradient-to-r from-primary to-pink-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg"
          >
            I am 18+
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="flex-1 border border-white/20 text-white font-semibold py-3 rounded-lg hover:bg-white/5"
          >
            Leave
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
