import { motion } from 'framer-motion';
import React from 'react';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

// Base skeleton component
export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  animate = true 
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 rounded';
  
  if (animate) {
    return (
      <motion.div
        className={`${baseClasses} ${className}`}
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    );
  }
  
  return <div className={`${baseClasses} ${className}`} />;
};

// Product card skeleton
export const ProductCardSkeleton: React.FC = () => (
  <div className="card p-4 space-y-4">
    <Skeleton className="w-full h-48" />
    <div className="space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  </div>
);

// Order item skeleton
export const OrderItemSkeleton: React.FC = () => (
  <div className="card p-4 space-y-4">
    <div className="flex items-center space-x-4">
      <Skeleton className="w-16 h-16 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  </div>
);

// Review card skeleton
export const ReviewCardSkeleton: React.FC = () => (
  <div className="card p-4 space-y-4">
    <div className="flex items-start space-x-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-24" />
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-4 h-4" />
            ))}
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  </div>
);

// Dashboard card skeleton
export const DashboardCardSkeleton: React.FC = () => (
  <div className="card p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="w-12 h-12 rounded-lg" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-6 w-16" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => (
  <tr className="border-b border-gray-200 dark:border-gray-700">
    {[...Array(columns)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Chat message skeleton
export const ChatMessageSkeleton: React.FC<{ isFromUser?: boolean }> = ({ 
  isFromUser = false 
}) => (
  <div className={`flex ${isFromUser ? 'justify-end' : 'justify-start'} mb-4`}>
    {!isFromUser && <Skeleton className="w-8 h-8 rounded-full mr-3" />}
    <div className={`max-w-xs space-y-2 ${isFromUser ? 'mr-3' : ''}`}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-12 w-48" />
    </div>
    {isFromUser && <Skeleton className="w-8 h-8 rounded-full ml-3" />}
  </div>
);

// Profile skeleton
export const ProfileSkeleton: React.FC = () => (
  <div className="card p-6 space-y-6">
    <div className="flex items-center space-x-6">
      <Skeleton className="w-24 h-24 rounded-full" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  </div>
);

// Hero section skeleton
export const HeroSkeleton: React.FC = () => (
  <div className="relative h-96 md:h-[500px] overflow-hidden rounded-lg">
    <Skeleton className="w-full h-full" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
        <div className="flex justify-center space-x-4 pt-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-28" />
        </div>
      </div>
    </div>
  </div>
);

// Navigation skeleton
export const NavSkeleton: React.FC = () => (
  <nav className="bg-white dark:bg-gray-800 shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <Skeleton className="h-8 w-32" />
        <div className="hidden md:flex space-x-8">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  </nav>
);

// List skeleton with multiple items
export const ListSkeleton: React.FC<{ 
  items?: number;
  ItemComponent: React.ComponentType;
}> = ({ items = 3, ItemComponent }) => (
  <div className="space-y-4">
    {[...Array(items)].map((_, i) => (
      <ItemComponent key={i} />
    ))}
  </div>
);

// Grid skeleton
export const GridSkeleton: React.FC<{
  items?: number;
  columns?: string;
  ItemComponent: React.ComponentType;
}> = ({ 
  items = 6, 
  columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  ItemComponent 
}) => (
  <div className={`grid ${columns} gap-6`}>
    {[...Array(items)].map((_, i) => (
      <ItemComponent key={i} />
    ))}
  </div>
);

// Page skeleton wrapper
export const PageSkeleton: React.FC<{
  showNav?: boolean;
  children: React.ReactNode;
}> = ({ showNav = true, children }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    {showNav && <NavSkeleton />}
    <main className="container mx-auto px-4 py-8">
      {children}
    </main>
  </div>
);

export default Skeleton; 