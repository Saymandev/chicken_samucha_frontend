# Facebook Pixel Integration Guide

## Overview
This guide explains how to use Facebook Pixel tracking in your React application.

## Setup Complete ✓
The Facebook Pixel base code has been installed in `public/index.html` with your Pixel ID: `1154111542712079`

**Important:** You use **ONE pixel for your entire application**. The same pixel tracks all pages and events automatically. You don't need separate pixels for separate pages.

## Automatic Tracking
The following is tracked automatically:
- ✓ **PageView**: Tracked on every route change in `App.tsx`

## Manual Event Tracking

### Import the tracking functions
```typescript
import { 
  trackViewContent,
  trackAddToCart,
  trackAddToWishlist,
  trackInitiateCheckout,
  trackPurchase,
  trackCompleteRegistration,
  trackSearch,
  trackContact
} from '../utils/facebookPixel';
```

### Example 1: Track Product Views
Add to `ProductDetailPage.tsx` when product loads:

```typescript
useEffect(() => {
  if (product) {
    trackViewContent({
      content_name: product.name.en,
      content_category: product.category.name.en,
      content_ids: [product.id],
      content_type: 'product',
      value: product.discountPrice || product.price,
      currency: 'BDT'
    });
  }
}, [product]);
```

### Example 2: Track Add to Cart
Add to the `handleAddToCart` function in `ProductDetailPage.tsx`:

```typescript
const handleAddToCart = async () => {
  // ... existing code ...
  
  // Track Facebook Pixel event
  trackAddToCart({
    content_name: product.name[language],
    content_ids: [product.id],
    content_type: 'product',
    value: effectivePrice * quantity,
    currency: 'BDT'
  });
  
  // ... rest of existing code ...
};
```

### Example 3: Track Add to Wishlist
Add to the wishlist toggle function:

```typescript
const handleWishlistToggle = async () => {
  if (isInWishlist(product.id)) {
    await removeFromWishlist(product.id);
  } else {
    await addToWishlist(product.id);
    
    // Track Facebook Pixel event
    trackAddToWishlist({
      content_name: product.name[language],
      content_ids: [product.id],
      content_category: product.category.name[language],
      value: product.discountPrice || product.price,
      currency: 'BDT'
    });
  }
};
```

### Example 4: Track Checkout Initiation
Add to `CheckoutPage.tsx` when checkout starts:

```typescript
useEffect(() => {
  const cartItems = useStore.getState().cart;
  
  trackInitiateCheckout({
    content_ids: cartItems.map(item => item.id),
    contents: cartItems.map(item => ({
      id: item.id,
      quantity: item.quantity
    })),
    num_items: cartItems.length,
    value: cartItems.reduce((total, item) => total + (item.price * item.quantity), 0),
    currency: 'BDT'
  });
}, []);
```

### Example 5: Track Purchase (IMPORTANT!)
Add to `PaymentSuccessPage.tsx` after successful payment:

```typescript
useEffect(() => {
  const order = searchParams.get('order');
  const status = searchParams.get('status');
  
  if (status === 'success') {
    (async () => {
      try {
        if (order) {
          const orderDetails = await ordersAPI.trackOrder(order);
          
          // Track Facebook Pixel Purchase event
          trackPurchase({
            value: orderDetails.totalAmount,
            currency: 'BDT',
            content_ids: orderDetails.items.map((item: any) => item.product._id),
            contents: orderDetails.items.map((item: any) => ({
              id: item.product._id,
              quantity: item.quantity
            })),
            content_type: 'product',
            num_items: orderDetails.items.length
          });
          
          clearCart();
        }
      } catch (e) {
        console.error('Payment success processing error:', e);
      }
    })();
  }
}, [searchParams]);
```

### Example 6: Track User Registration
Add to `RegisterPage.tsx` after successful registration:

```typescript
const handleRegister = async () => {
  // ... existing registration code ...
  
  // After successful registration
  trackCompleteRegistration({
    content_name: 'User Registration',
    status: 'completed'
  });
  
  // ... rest of code ...
};
```

### Example 7: Track Search
Add to `ProductsPage.tsx` when user searches:

```typescript
const handleSearch = (searchTerm: string) => {
  // ... existing search code ...
  
  trackSearch({
    search_string: searchTerm,
    content_category: selectedCategory || undefined
  });
  
  // ... rest of code ...
};
```

### Example 8: Track Contact Form Submission
Add to `ContactUsPage.tsx` after form submission:

```typescript
const handleSubmit = async () => {
  // ... existing form submission code ...
  
  // After successful submission
  trackContact();
  
  // ... rest of code ...
};
```

## Standard Facebook Pixel Events

The following standard events are available:

### E-commerce Events
- `trackViewContent()` - When a user views a product
- `trackAddToCart()` - When a user adds a product to cart
- `trackAddToWishlist()` - When a user adds a product to wishlist
- `trackInitiateCheckout()` - When a user starts checkout
- `trackPurchase()` - **MOST IMPORTANT** - When a purchase is completed
- `trackSearch()` - When a user searches

### Lead Events
- `trackCompleteRegistration()` - When a user completes registration
- `trackLead()` - When a user submits a lead form

### Engagement Events
- `trackContact()` - When a user contacts you
- `trackSubmitApplication()` - When a user submits an application

## Custom Events

For custom events not covered by standard events:

```typescript
import { trackCustomEvent } from '../utils/facebookPixel';

trackCustomEvent('CustomEventName', {
  custom_parameter: 'value',
  another_parameter: 123
});
```

## Testing Your Pixel

1. Install **Facebook Pixel Helper** Chrome extension
2. Visit your website
3. The extension will show you which events are being tracked
4. You can also test in Facebook Events Manager under "Test Events"

## Important Notes

1. **Currency**: Always use 'BDT' for Bangladesh Taka
2. **Content IDs**: Use product IDs or order IDs
3. **Value**: Always include the monetary value in events
4. **Privacy**: Ensure you have proper privacy policy and consent mechanisms
5. **One Pixel for All**: The same pixel (1154111542712079) tracks everything - don't create multiple pixels

## Next Steps

1. Add tracking to key pages as shown in examples above
2. Test with Facebook Pixel Helper
3. Verify events in Facebook Events Manager
4. Create Custom Audiences and Conversion events in Facebook Ads Manager

## Facebook Ads Manager Setup

After implementing tracking:
1. Go to Facebook Events Manager
2. Verify events are being received
3. Create Custom Conversions for important events (like Purchase)
4. Use these conversions in your ad campaigns for optimization

## Questions?

If you need to track additional events or have questions about implementation, refer to:
- Facebook Pixel documentation: https://developers.facebook.com/docs/meta-pixel
- Your implementation file: `frontend/src/utils/facebookPixel.ts`

