import { useEffect, useState } from 'react';
import { flashSaleAPI } from '../utils/api';

interface FlashSalePrice {
  isOnFlashSale: boolean;
  originalPrice: number;
  flashSalePrice: number;
  discountPercentage: number;
  stockLimit?: number;
  soldCount: number;
  remainingStock?: number;
  flashSaleEndTime?: string;
}

interface FlashSaleData {
  [productId: string]: FlashSalePrice;
}

// Global cache for flash sale data
let flashSaleCache: FlashSaleData = {};
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

export const useFlashSalePrice = (productId: string): FlashSalePrice | null => {
  const [flashSalePrice, setFlashSalePrice] = useState<FlashSalePrice | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFlashSaleData = async () => {
      const now = Date.now();
      
      // Use cache if it's fresh
      if (flashSaleCache[productId] && (now - lastFetchTime) < CACHE_DURATION) {
        setFlashSalePrice(flashSaleCache[productId]);
        return;
      }

      // Only fetch if we don't have recent data
      if ((now - lastFetchTime) >= CACHE_DURATION) {
        try {
          setLoading(true);
          const response = await flashSaleAPI.getCurrentFlashSales();
          
          if (response.data.success) {
            const newCache: FlashSaleData = {};
            
            response.data.flashSales.forEach((sale: any) => {
              sale.products.forEach((item: any) => {
                newCache[item.product._id] = {
                  isOnFlashSale: true,
                  originalPrice: item.originalPrice,
                  flashSalePrice: item.flashSalePrice,
                  discountPercentage: item.discountPercentage,
                  stockLimit: item.stockLimit,
                  soldCount: item.soldCount,
                  remainingStock: item.remainingStock,
                  flashSaleEndTime: sale.endTime
                };
              });
            });
            
            flashSaleCache = newCache;
            lastFetchTime = now;
            
            setFlashSalePrice(flashSaleCache[productId] || null);
          }
        } catch (error) {
          console.error('Error fetching flash sale data:', error);
          setFlashSalePrice(null);
        } finally {
          setLoading(false);
        }
      } else {
        // Use existing cache
        setFlashSalePrice(flashSaleCache[productId] || null);
      }
    };

    if (productId) {
      fetchFlashSaleData();
    }
  }, [productId]);

  return flashSalePrice;
};

// Hook to get all flash sale data (for bulk operations)
export const useAllFlashSalePrices = () => {
  const [flashSalePrices, setFlashSalePrices] = useState<FlashSaleData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllFlashSaleData = async () => {
      const now = Date.now();
      
      // Use cache if it's fresh
      if ((now - lastFetchTime) < CACHE_DURATION && Object.keys(flashSaleCache).length > 0) {
        setFlashSalePrices(flashSaleCache);
        return;
      }

      try {
        setLoading(true);
        const response = await flashSaleAPI.getCurrentFlashSales();
        
        if (response.data.success) {
          const newCache: FlashSaleData = {};
          
          response.data.flashSales.forEach((sale: any) => {
            sale.products.forEach((item: any) => {
              newCache[item.product._id] = {
                isOnFlashSale: true,
                originalPrice: item.originalPrice,
                flashSalePrice: item.flashSalePrice,
                discountPercentage: item.discountPercentage,
                stockLimit: item.stockLimit,
                soldCount: item.soldCount,
                remainingStock: item.remainingStock,
                flashSaleEndTime: sale.endTime
              };
            });
          });
          
          flashSaleCache = newCache;
          lastFetchTime = now;
          
          setFlashSalePrices(flashSaleCache);
        }
      } catch (error) {
        console.error('Error fetching flash sale data:', error);
        setFlashSalePrices({});
      } finally {
        setLoading(false);
      }
    };

    fetchAllFlashSaleData();
  }, []);

  return { flashSalePrices, loading };
};

// Utility function to clear cache (useful when flash sales end)
export const clearFlashSaleCache = () => {
  flashSaleCache = {};
  lastFetchTime = 0;
};
