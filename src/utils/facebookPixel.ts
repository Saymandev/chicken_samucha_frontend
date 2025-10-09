/**
 * Facebook Pixel tracking utilities
 * Use these functions to track custom events throughout your application
 */

declare global {
  interface Window {
    fbq: (
      action: string,
      eventName: string,
      parameters?: Record<string, any>
    ) => void;
  }
}

/**
 * Track a standard Facebook Pixel event
 * @param eventName - Name of the event (e.g., 'Purchase', 'AddToCart', 'ViewContent')
 * @param parameters - Optional parameters for the event
 */
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
    console.log(`[FB Pixel] Tracked event: ${eventName}`, parameters);
  }
};

/**
 * Track a custom Facebook Pixel event
 * @param eventName - Name of the custom event
 * @param parameters - Optional parameters for the event
 */
export const trackCustomEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, parameters);
    console.log(`[FB Pixel] Tracked custom event: ${eventName}`, parameters);
  }
};

/**
 * Track PageView event (useful for SPAs when route changes)
 */
export const trackPageView = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
    console.log('[FB Pixel] Tracked PageView');
  }
};

/**
 * Standard Facebook Pixel Events with TypeScript helpers
 */

// E-commerce Events
export const trackViewContent = (params: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) => {
  trackEvent('ViewContent', params);
};

export const trackAddToCart = (params: {
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) => {
  trackEvent('AddToCart', params);
};

export const trackAddToWishlist = (params: {
  content_name?: string;
  content_ids?: string[];
  content_category?: string;
  value?: number;
  currency?: string;
}) => {
  trackEvent('AddToWishlist', params);
};

export const trackInitiateCheckout = (params: {
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  num_items?: number;
  value?: number;
  currency?: string;
}) => {
  trackEvent('InitiateCheckout', params);
};

export const trackPurchase = (params: {
  value: number;
  currency: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  content_type?: string;
  num_items?: number;
}) => {
  trackEvent('Purchase', params);
};

export const trackSearch = (params: {
  search_string: string;
  content_category?: string;
  content_ids?: string[];
}) => {
  trackEvent('Search', params);
};

// Lead Events
export const trackLead = (params?: {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) => {
  trackEvent('Lead', params);
};

export const trackCompleteRegistration = (params?: {
  content_name?: string;
  status?: string;
  value?: number;
  currency?: string;
}) => {
  trackEvent('CompleteRegistration', params);
};

// Engagement Events
export const trackContact = () => {
  trackEvent('Contact');
};

export const trackSubmitApplication = () => {
  trackEvent('SubmitApplication');
};

