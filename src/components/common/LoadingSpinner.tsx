import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useStore } from '../../store/useStore';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  overlay = false,
  text,
  className = ''
}) => {
  const { isLoading } = useStore();

  if (!isLoading && !overlay) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinner = (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-gray-200 border-t-primary-600 rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );

  if (overlay || isLoading) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl"
          >
            <div className="flex flex-col items-center space-y-4">
              {spinner}
              {text && (
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  {text}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return spinner;
};

// Inline loading component for buttons
export const ButtonLoader: React.FC<{ loading?: boolean; children: React.ReactNode }> = ({
  loading = false,
  children
}) => (
  <div className="flex items-center justify-center space-x-2">
    {loading && <LoadingSpinner size="sm" />}
    <span className={loading ? 'opacity-75' : ''}>{children}</span>
  </div>
);

// Full page loading with skeleton
export const FullPageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">{text}</p>
    </div>
  </div>
);

export default LoadingSpinner; 