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

    // Ensure value is a valid positive number
    const numericValue = Number(rawValue);
    const finalValue = Number.isFinite(numericValue) && numericValue > 0
      ? Number(numericValue.toFixed(2))
      : 0;

    // Ensure currency is a valid 3-letter ISO code
    const rawCurrency = customData.currency || 'BDT';
    const finalCurrency = String(rawCurrency).toUpperCase().substring(0, 3);

    // Meta requires value and currency for Purchase events
    normalizedCustomData.value = finalValue;
    normalizedCustomData.currency = finalCurrency;

    // Log warning if value is 0 (shouldn't happen for real purchases)
    if (finalValue === 0) {
      console.warn('⚠️ Purchase event with value 0 - this may cause Meta validation issues');
    }
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


