import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Product, useStore } from '../store/useStore';
import { wishlistAPI } from '../utils/api';

interface WishlistItem {
  id: string;
  product: Product;
  addedAt: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const { user } = useStore();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist items
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      setWishlistCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await wishlistAPI.getWishlist();
      if (response.data.success) {
        setWishlistItems(response.data.data || []);
        setWishlistCount(response.data.data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);


  // Add product to wishlist
  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    try {
      const response = await wishlistAPI.addToWishlist(productId);
      if (response.data.success) {
        // Refresh wishlist
        await fetchWishlist();
        toast.success('Added to wishlist');
      }
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      const message = error.response?.data?.message || 'Failed to add to wishlist';
      toast.error(message);
    }
  };

  // Remove product from wishlist
  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      const response = await wishlistAPI.removeFromWishlist(productId);
      if (response.data.success) {
        // Update local state
        setWishlistItems(prev => prev.filter(item => item.product.id !== productId));
        setWishlistCount(prev => Math.max(0, prev - 1));
        toast.success('Removed from wishlist');
      }
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      const message = error.response?.data?.message || 'Failed to remove from wishlist';
      toast.error(message);
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.product.id === productId);
  };

  // Clear entire wishlist
  const clearWishlist = async () => {
    if (!user) return;

    try {
      const response = await wishlistAPI.clearWishlist();
      if (response.data.success) {
        setWishlistItems([]);
        setWishlistCount(0);
        toast.success('Wishlist cleared');
      }
    } catch (error: any) {
      console.error('Error clearing wishlist:', error);
      const message = error.response?.data?.message || 'Failed to clear wishlist';
      toast.error(message);
    }
  };

  // Refresh wishlist
  const refreshWishlist = async () => {
    await fetchWishlist();
  };

  // Load wishlist when user changes
  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setWishlistCount(0);
    }
  }, [user, fetchWishlist]);

  const value: WishlistContextType = {
    wishlistItems,
    wishlistCount,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    refreshWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
