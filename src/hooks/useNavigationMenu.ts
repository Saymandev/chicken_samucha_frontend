import { useEffect, useState } from 'react';
import { navigationAPI } from '../utils/api';

export interface NavigationMenuItem {
  id: string;
  title: {
    en: string;
    bn: string;
  };
  path: string;
  icon?: string;
  badge?: {
    text: string;
    color: 'red' | 'orange' | 'green' | 'blue' | 'purple';
  };
  order: number;
  isActive: boolean;
  isExternal: boolean;
  target: '_self' | '_blank';
  parentId?: string;
  children?: NavigationMenuItem[];
  permissions: string[];
  cssClass?: string;
  description?: {
    en: string;
    bn: string;
  };
}

export const useNavigationMenu = () => {
  const [menuItems, setMenuItems] = useState<NavigationMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await navigationAPI.getNavigationMenu();
      
      if (response.data.success) {
        setMenuItems(response.data.data || []);
      } else {
        setError('Failed to fetch navigation menu');
      }
      } catch (err: any) {
        // Gracefully handle missing route in backend (404) and other failures
        const status = err?.response?.status;
        if (status === 404) {
          // Backend doesn't have /api/navigation yet – use fallback silently
          setMenuItems(getDefaultMenuItems());
          setError(null);
        } else {
          console.debug('Navigation API error (using fallback):', err);
          setError(err?.response?.data?.message || 'Failed to fetch navigation menu');
          setMenuItems(getDefaultMenuItems());
        }
      } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const refreshMenu = () => {
    fetchMenuItems();
  };

  return {
    menuItems,
    loading,
    error,
    refreshMenu
  };
};

// Default menu items as fallback
const getDefaultMenuItems = (): NavigationMenuItem[] => [
  {
    id: '1',
    title: { en: 'HOME', bn: 'হোম' },
    path: '/',
    order: 1,
    isActive: true,
    isExternal: false,
    target: '_self',
    permissions: ['public']
  },
  {
    id: '2',
    title: { en: 'HOT OFFERS!', bn: 'হট অফার!' },
    path: '/products?filter=offers',
    badge: { text: 'Sale', color: 'red' },
    order: 2,
    isActive: true,
    isExternal: false,
    target: '_self',
    permissions: ['public']
  },
  {
    id: '3',
    title: { en: 'BEST SELLERS', bn: 'সর্বাধিক বিক্রিত' },
    path: '/products?filter=best-seller',
    order: 3,
    isActive: true,
    isExternal: false,
    target: '_self',
    permissions: ['public']
  },
  {
    id: '4',
    title: { en: 'ALL PRODUCTS', bn: 'সব পণ্য' },
    path: '/products',
    order: 4,
    isActive: true,
    isExternal: false,
    target: '_self',
    permissions: ['public']
  },
  {
    id: '5',
    title: { en: 'COMBO', bn: 'কম্বো' },
    path: '/products?filter=combo',
    badge: { text: 'Hot', color: 'orange' },
    order: 5,
    isActive: true,
    isExternal: false,
    target: '_self',
    permissions: ['public']
  },
  {
    id: '6',
    title: { en: 'CLEARANCE', bn: 'ক্লিয়ারেন্স' },
    path: '/products?filter=clearance',
    order: 6,
    isActive: true,
    isExternal: false,
    target: '_self',
    permissions: ['public']
  }
];

