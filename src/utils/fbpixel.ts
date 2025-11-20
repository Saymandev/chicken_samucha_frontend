import api from './api';

export function generateEventId(prefix = 'evt') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function trackBrowserAndServer(
  eventName: string,
  {
    eventId = generateEventId(eventName),
    customData = {},
    userData = {},
    eventSourceUrl = typeof window !== 'undefined' ? window.location.href : '',
  }: {
    eventId?: string;
    customData?: Record<string, any>;
    userData?: Record<string, any>;
    eventSourceUrl?: string;
  } = {}
) {
  const normalizedCustomData = { ...customData };

  if (eventName === 'Purchase') {
    // Extract value from various possible fields
    const rawValue =
      customData.value ??
      customData.total ??
      customData.totalAmount ??
      customData.order_value ??
      customData.finalAmount ??
      customData.price ??
      0;

    console.log('🛒 [Meta Pixel] Purchase Event - Raw Data:', {
      rawValue,
      rawCurrency: customData.currency,
      allCustomData: customData
    });

    // Meta requires: value must be numeric and > 0
    const numericValue = Number(rawValue);
    let finalValue: number | undefined;
    
    if (Number.isFinite(numericValue) && numericValue > 0) {
      // Format to 2 decimal places (e.g., 9.99 or 9.00)
      // Meta allows decimals like 9.99 or whole numbers like 9
      finalValue = Number(numericValue.toFixed(2));
      console.log('✅ [Meta Pixel] Purchase Event - Value Valid:', {
        rawValue,
        numericValue,
        finalValue,
        isValid: finalValue > 0,
        isNumeric: typeof finalValue === 'number'
      });
    } else {
      // If value is invalid, log warning
      console.warn('⚠️ [Meta Pixel] Purchase Event - Invalid Value:', {
        rawValue,
        numericValue,
        reason: numericValue <= 0 ? 'Value must be > 0' : 'Value is not a number',
        metaRequirement: 'Meta requires value > 0'
      });
      // Don't set value if it's invalid (Meta will reject it anyway)
      finalValue = undefined;
    }

    // Ensure currency is a valid 3-letter ISO code (no extra characters)
    const rawCurrency = customData.currency || 'BDT';
    // Extract exactly 3 uppercase letters (e.g., "BDT", "USD")
    const finalCurrency = String(rawCurrency).toUpperCase().substring(0, 3).replace(/[^A-Z]/g, '') || 'BDT';

    console.log('💰 [Meta Pixel] Purchase Event - Currency:', {
      rawCurrency,
      finalCurrency,
      isValid: finalCurrency.length === 3 && /^[A-Z]{3}$/.test(finalCurrency)
    });

    // Meta requires value and currency for Purchase events
    if (finalValue !== undefined) {
      normalizedCustomData.value = finalValue;
    }
    normalizedCustomData.currency = finalCurrency;

    console.log('📤 [Meta Pixel] Purchase Event - Final Data Being Sent:', {
      value: normalizedCustomData.value,
      currency: normalizedCustomData.currency,
      hasValue: normalizedCustomData.value !== undefined,
      hasCurrency: !!normalizedCustomData.currency,
      meetsMetaRequirements: normalizedCustomData.value !== undefined && 
                              normalizedCustomData.value > 0 && 
                              normalizedCustomData.currency.length === 3
    });
  }

  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, normalizedCustomData, { eventID: eventId });
  }

  api
    .post('/events', {
      eventName,
      eventId,
      eventSourceUrl,
      userData,
      customData: normalizedCustomData,
      eventTime: Math.floor(Date.now() / 1000),
    })
    .catch(() => {});

  return eventId;
}


