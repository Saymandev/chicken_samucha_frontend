import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  avatar?: {
    url: string;
    public_id: string;
  };
  address?: {
    street: string;
    area: string;
    city: string;
    district: string;
    postalCode?: string;
  };
  preferredLanguage: 'en' | 'bn';
  preferredTheme: 'light' | 'dark';
}

export interface Product {
  id: string;
  name: {
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
  price: number;
  discountPrice?: number;
  images: Array<{
    url: string;
    public_id: string;
  }>;
  category: {
    _id: string;
    name: {
      en: string;
      bn: string;
    };
    slug: string;
  };
  ingredients: {
    en: string[];
    bn: string[];
  };
  preparationTime: string;
  servingSize: string;
  isFeatured: boolean;
  isAvailable: boolean;
  stock: number;
  ratings: {
    average: number;
    count: number;
  };
  minOrderQuantity: number;
  maxOrderQuantity: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: {
      street: string;
      area: string;
      city: string;
      district: string;
      postalCode?: string;
    };
  };
  items: CartItem[];
  totalAmount: number;
  deliveryCharge: number;
  finalAmount: number;
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentInfo: {
    method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'cash_on_delivery';
    status: 'pending' | 'verified' | 'failed' | 'refunded';
    transactionId?: string;
    screenshot?: {
      url: string;
      public_id: string;
    };
  };
  createdAt: string;
  estimatedDeliveryTime?: string;
}

interface AppStore {
  // Auth state
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Theme and language
  theme: 'light' | 'dark';
  language: 'en' | 'bn';
  
  // Cart state
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  
  // UI state
  isLoading: boolean;
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setLanguage: (language: 'en' | 'bn') => void;
  toggleLanguage: () => void;
  
  addToCart: (product: Product, quantity: number) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      
      theme: 'light',
      language: 'en',
      
      cart: [],
      cartCount: 0,
      cartTotal: 0,
      
      isLoading: false,
      isSidebarOpen: false,
      isMobileMenuOpen: false,
      
      // Auth actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true,
        theme: user.preferredTheme,
        language: user.preferredLanguage
      }),
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        cart: [],
        cartCount: 0,
        cartTotal: 0
      }),
      
      // Theme and language actions
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
      setLanguage: (language) => set({ language }),
      toggleLanguage: () => set((state) => ({ 
        language: state.language === 'en' ? 'bn' : 'en' 
      })),
      
      // Cart actions
      addToCart: (product, quantity) => {
        const state = get();
        const productId = product.id || (product as any)._id;
        const existingItem = state.cart.find(item => {
          const itemId = item.product.id || (item.product as any)._id;
          return itemId === productId;
        });
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity <= product.maxOrderQuantity) {
            const updatedCart = state.cart.map(item => {
              const itemId = item.product.id || (item.product as any)._id;
              return itemId === productId
                ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
                : item;
            });
            const cartCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
            const cartTotal = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);
            
            set({ cart: updatedCart, cartCount, cartTotal });
          }
        } else {
          const price = product.discountPrice || product.price;
          const newItem: CartItem = {
            product: { ...product, id: productId },
            quantity,
            price,
            subtotal: price * quantity
          };
          const updatedCart = [...state.cart, newItem];
          const cartCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
          const cartTotal = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);
          
          set({ cart: updatedCart, cartCount, cartTotal });
        }
      },
      
      updateCartItem: (productId, quantity) => {
        const state = get();
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        
        const updatedCart = state.cart.map(item => {
          const itemId = item.product.id || (item.product as any)._id;
          return itemId === productId
            ? { ...item, quantity, subtotal: item.price * quantity }
            : item;
        });
        const cartCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
        const cartTotal = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);
        
        set({ cart: updatedCart, cartCount, cartTotal });
      },
      
      removeFromCart: (productId) => {
        const state = get();
        const updatedCart = state.cart.filter(item => {
          const itemId = item.product.id || (item.product as any)._id;
          return itemId !== productId;
        });
        const cartCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
        const cartTotal = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);
        
        set({ cart: updatedCart, cartCount, cartTotal });
      },
      
      clearCart: () => set({ cart: [], cartCount: 0, cartTotal: 0 }),
      
      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
    }),
    {
      name: 'chicken-samosa-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        language: state.language,
        cart: state.cart,
        cartCount: state.cartCount,
        cartTotal: state.cartTotal,
      }),
    }
  )
); 