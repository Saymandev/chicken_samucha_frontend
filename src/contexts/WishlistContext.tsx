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
  const [loading, setLoading] = useState(true); // Start with loading true

  // Fetch wishlist items
  const fetchWishlist = useCallback(async () => {
    
    
    if (!user) {
      
      setWishlistItems([]);
      setWishlistCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const response = await Promise.race([
        wishlistAPI.getWishlist(),
        timeoutPromise
      ]) as any;
      
     
      
      if (response.data.success) {
        setWishlistItems(response.data.data || []);
        setWishlistCount(response.data.data?.length || 0);
       
      } else {
        console.error('❌ API returned success: false', response.data);
        toast.error('Failed to fetch wishlist data');
      }
    } catch (error: any) {
      console.error('❌ Error fetching wishlist:', error);
      if (error.message === 'Request timeout') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Failed to fetch wishlist');
      }
      // Set empty state on error
      setWishlistItems([]);
      setWishlistCount(0);
    } finally {
      setLoading(false);
      
    }
  }, [user]); // Keep user dependency but fix the useEffect


  // Add product to wishlist
  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    try {
      setLoading(true);
      
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
    } finally {
      setLoading(false);
    }
  };

  // Remove product from wishlist
  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      const response = await wishlistAPI.removeFromWishlist(productId);
      if (response.data.success) {
        // Update local state immediately for instant UI update
        setWishlistItems(prev => prev.filter(item => 
          (item.product as any).id !== productId && (item.product as any)._id !== productId
        ));
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
  const isInWishlist = useCallback((productId: string): boolean => {
    const result = wishlistItems.some(item => {
      const itemId = (item.product as any).id || (item.product as any)._id;
      return itemId === productId;
    });
    
    
    
    return result;
  }, [wishlistItems]);

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

  // Refresh wishlist (stable reference to avoid re-renders/useEffect loops)
  const refreshWishlist = useCallback(async () => {
    await fetchWishlist();
  }, [fetchWishlist]);

  // Load wishlist when user changes
  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setWishlistCount(0);
      setLoading(false); // Ensure loading is false when no user
    }
  }, [user, user?.id, fetchWishlist]);

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
