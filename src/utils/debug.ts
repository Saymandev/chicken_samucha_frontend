import { ordersAPI } from './api';

// Debug utility to test authentication and API endpoints
export const debugAPI = {
  // Test if authentication is working
  testAuth: async () => {
    try {
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No token found in localStorage');
        return { success: false, error: 'No token found' };
      }
      
      
      
      // Test the auth endpoint
      const response = await fetch('/api/orders/auth-test', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        
        return { success: true, data };
      } else {
        console.error('❌ Authentication test failed:', data);
        return { success: false, error: data.message };
      }
    } catch (error: any) {
      console.error('❌ Authentication test error:', error);
      return { success: false, error: error.message };
    }
  },

  // Test orders API
  testOrdersAPI: async () => {
    try {
   
      const response = await ordersAPI.getMyOrders();
      
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('❌ Orders API error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        status: error.response?.status 
      };
    }
  },

  // Full diagnostic
  runDiagnostic: async () => {
    
    
    // Check localStorage
    const token = localStorage.getItem('token');
    const hasToken = !!token;
    
    
    if (hasToken) {
      try {
        // Decode token (basic check)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = new Date(payload.exp * 1000);
        // Check if expired (validation only)
        if (expiry < new Date()) {
          console.warn('⚠️ Token expired');
        }
      } catch (error) {
        console.error('❌ Invalid token format');
      }
    }
    
    // Test authentication
    const authResult = await debugAPI.testAuth();
    
    // Test orders API if auth passes
    if (authResult.success) {
      await debugAPI.testOrdersAPI();
    }
    
   
  }
};

// Global debug function for development
if (process.env.NODE_ENV === 'development') {
  (window as any).debugAPI = debugAPI;
  
} 