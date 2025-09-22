import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { publicAPI } from '../utils/api';

interface Promotion {
  id: string;
  _id: string;
  title: {
    en: string;
    bn: string;
  };
  description: {
    en: string;
    bn: string;
  };
  shortDescription?: {
    en: string;
    bn: string;
  };
  image?: {
    url: string;
    public_id: string;
  };
  bannerImage?: {
    url: string;
    public_id: string;
  };
  type: 'discount' | 'special_offer' | 'announcement' | 'seasonal' | 'flash_sale';
  discountType: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
  discountValue: number;
  validUntil: string;
  displayFrequency?: 'once_per_session' | 'once_per_day' | 'always' | 'custom';
  displayRules?: {
    showOnHomepage: boolean;
    showOnProductPage: boolean;
    showOnCartPage: boolean;
    showOnCheckout: boolean;
    minimumOrderAmount: number;
  };
  priority?: number;
  targetAudience?: string;
  ctaButton: {
    text: {
      en: string;
      bn: string;
    };
    link: string;
    action: 'navigate' | 'apply_coupon' | 'open_catalog' | 'contact_us';
  };
  timeRemaining?: number;
  isValid?: boolean;
}

// Check if promotion should be shown based on display frequency
const shouldShowPromotion = (promotion: Promotion, pathname: string): boolean => {
    const pid: any = (promotion as any).id || (promotion as any)._id;
    const sessionKey = `promotion_${pid}_session`;
    const dailyKey = `promotion_${pid}_daily`;
    
    // Provide defaults for missing fields
    const displayFrequency = promotion.displayFrequency || 'always';
    const displayRules = promotion.displayRules || {
      showOnHomepage: true,
      showOnProductPage: false,
      showOnCartPage: false,
      showOnCheckout: false,
      minimumOrderAmount: 0
    };
    
    // Check display rules based on current page
    const getCurrentPageType = () => {
      if (pathname === '/') return 'homepage';
      if (pathname.startsWith('/products')) return 'product';
      if (pathname === '/cart') return 'cart';
      if (pathname === '/checkout') return 'checkout';
      return 'homepage';
    };
    
    const pageType = getCurrentPageType();
    let pageRulePassed = false;
    
    switch (pageType) {
      case 'homepage':
        pageRulePassed = displayRules.showOnHomepage;
        break;
      case 'product':
        pageRulePassed = displayRules.showOnProductPage;
        break;
      case 'cart':
        pageRulePassed = displayRules.showOnCartPage;
        break;
      case 'checkout':
        pageRulePassed = displayRules.showOnCheckout;
        break;
      default:
        pageRulePassed = true;
    }
    
    if (!pageRulePassed) {
      return false;
    }
    
    let shouldShow = false;
    switch (displayFrequency) {
      case 'once_per_session':
        shouldShow = !sessionStorage.getItem(sessionKey);
        break;
      case 'once_per_day':
        const lastShown = localStorage.getItem(dailyKey);
        if (!lastShown) {
          shouldShow = true;
        } else {
          const lastShownDate = new Date(lastShown);
          const today = new Date();
          shouldShow = lastShownDate.toDateString() !== today.toDateString();
        }
        break;
      case 'always':
        shouldShow = true;
        break;
      default:
        shouldShow = true;
        break;
    }
    
    return shouldShow;
};

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setSocket] = useState<Socket | null>(null);
  const location = useLocation();

  // Mark promotion as shown
  const markPromotionAsShown = (promotion: Promotion) => {
    const id = (promotion as any).id || (promotion as any)._id;
    const sessionKey = `promotion_${id}_session`;
    const dailyKey = `promotion_${id}_daily`;
    
    switch (promotion.displayFrequency) {
      case 'once_per_session':
        sessionStorage.setItem(sessionKey, 'true');
        break;
      case 'once_per_day':
        localStorage.setItem(dailyKey, new Date().toISOString());
        break;
    }
  };

  // Fetch active promotions
  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
    // Get current page type for filtering promotions
    const getCurrentPageType = () => {
      if (location.pathname === '/') return 'homepage';
      if (location.pathname.startsWith('/products')) return 'product';
      if (location.pathname === '/cart') return 'cart';
      if (location.pathname === '/checkout') return 'checkout';
      return 'homepage';
    };
    
    const pageType = getCurrentPageType();
    
    const response = await publicAPI.getActivePromotions({
      page: pageType,
      limit: 5,
      targetAudience: 'all'
    });
    
    if (response.data.success) {
      const promotions = (response.data.promotions || []).map((p: any) => ({
        ...p,
        id: String(p?.id ?? p?._id ?? ''),
        _id: String(p?._id ?? p?.id ?? '')
      }));
      setPromotions(promotions);
      
      // Find the first promotion that should be shown
      const promotionToShow = promotions.find((promotion: Promotion) => shouldShowPromotion(promotion, location.pathname));
      if (promotionToShow) {
        setCurrentPromotion(promotionToShow);
      }
    }
    } catch (error) {
      console.error('❌ Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  }, [location.pathname]);

  // Track promotion view (only once per session)
  const trackPromotionView = async (promotionId: string) => {
    try {
      const sessionKey = `promotion_view_${promotionId}_session`;
      const hasViewed = sessionStorage.getItem(sessionKey);
      
      if (!hasViewed) {
        await publicAPI.trackPromotionView(promotionId);
        sessionStorage.setItem(sessionKey, 'true');
      }
    } catch (error) {
      console.error('Error tracking promotion view:', error);
    }
  };

  // Track promotion click (only once per session)
  const trackPromotionClick = async (promotionId: string) => {
    try {
      const sessionKey = `promotion_click_${promotionId}_session`;
      const hasClicked = sessionStorage.getItem(sessionKey);
      
      if (!hasClicked) {
        await publicAPI.trackPromotionClick(promotionId);
        sessionStorage.setItem(sessionKey, 'true');
      }
    } catch (error) {
      console.error('Error tracking promotion click:', error);
    }
  };

  // Close current promotion
  const closePromotion = () => {
    if (currentPromotion) {
      markPromotionAsShown(currentPromotion);
      setCurrentPromotion(null);
    }
  };

  // Handle promotion click
  const handlePromotionClick = async () => {
    if (currentPromotion) {
      await trackPromotionClick(currentPromotion.id);
    }
  };

  // Handle promotion updates
  const handlePromotionUpdate = useCallback((data: any) => {
    console.log('📢 Promotion update received:', data);
    const { promotion, action } = data;
    // Normalize id for socket payloads that might use _id
    const normalized = {
      ...promotion,
      id: String(promotion?.id ?? promotion?._id ?? ''),
      _id: String(promotion?._id ?? promotion?.id ?? '')
    };
    
    if (action === 'created' || action === 'activated') {
      // Add new promotion to the list
      setPromotions(prev => {
        const exists = prev.find(p => p.id === normalized.id);
        if (!exists) {
          return [normalized, ...prev];
        }
        return prev;
      });
      
      // Check if this promotion should be shown
      const shouldShow = shouldShowPromotion(normalized, location.pathname);
      if (shouldShow) {
        setCurrentPromotion(normalized);
      }
    } else if (action === 'deactivated' || action === 'deleted') {
      // Remove promotion from the list
      setPromotions(prev => prev.filter(p => p.id !== normalized.id));
      
      // Close modal if this was the current promotion
      setCurrentPromotion(prev => prev?.id === normalized.id ? null : prev);
    } else if (action === 'updated') {
      // Update existing promotion
      setPromotions(prev => 
        prev.map(p => p.id === normalized.id ? normalized : p)
      );
      
      // Update current promotion if it's the same one
      setCurrentPromotion(prev => prev?.id === normalized.id ? normalized : prev);
    }
  }, [location.pathname]);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://chicken-samucha-backend.onrender.com';
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to server for promotion updates');
      newSocket.emit('join-promotion-room');
    });

    newSocket.on('promotion-updated', handlePromotionUpdate);

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-promotion-room');
      newSocket.disconnect();
    };
  }, [handlePromotionUpdate]);

  // Load promotions on mount and when location changes
  useEffect(() => {
    fetchPromotions();
  }, [location.pathname, fetchPromotions]);

  // Track view when promotion is shown
  useEffect(() => {
    if (currentPromotion) {
      trackPromotionView(currentPromotion.id);
    }
  }, [currentPromotion]);

  return {
    promotions,
    currentPromotion,
    loading,
    closePromotion,
    handlePromotionClick,
    refreshPromotions: fetchPromotions
  };
};
