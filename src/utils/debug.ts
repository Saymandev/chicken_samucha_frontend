import { ordersAPI } from './api';

// Debug utility to test authentication and API endpoints
export const debugAPI = {
  // Test if authentication is working
  testAuth: async () => {
    try {
      console.log('🔍 Testing authentication...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No token found in localStorage');
        return { success: false, error: 'No token found' };
      }
      
      console.log('✅ Token found:', token.substring(0, 20) + '...');
      
      // Test the auth endpoint
      const response = await fetch('/api/orders/auth-test', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Authentication test successful:', data);
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
      console.log('🔍 Testing orders API...');
      const response = await ordersAPI.getMyOrders();
      console.log('✅ Orders API response:', response.data);
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
    console.log('🔍 Starting API diagnostic...');
    
    // Check localStorage
    const token = localStorage.getItem('token');
    const hasToken = !!token;
    console.log('📋 Token in localStorage:', hasToken ? '✅ Yes' : '❌ No');
    
    if (hasToken) {
      try {
        // Decode token (basic check)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = new Date(payload.exp * 1000);
        const isExpired = expiry < new Date();
        
        console.log('📋 Token expiry:', expiry.toLocaleString());
        console.log('📋 Token expired:', isExpired ? '❌ Yes' : '✅ No');
        console.log('📋 User ID in token:', payload.id);
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
    
    console.log('🔍 Diagnostic complete');
  }
};

// Global debug function for development
if (process.env.NODE_ENV === 'development') {
  (window as any).debugAPI = debugAPI;
  console.log('🛠️ Debug utilities available: window.debugAPI');
  console.log('💡 Run window.debugAPI.runDiagnostic() to test API connectivity');
} 