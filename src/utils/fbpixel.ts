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
    const numericValue =
      Number(
        customData.value ??
          customData.total ??
          customData.totalAmount ??
          customData.order_value ??
          customData.finalAmount ??
          customData.price
      ) || 0;

    normalizedCustomData.value = Number.isFinite(numericValue)
      ? Number(numericValue.toFixed(2))
      : 0;
    normalizedCustomData.currency = (customData.currency || 'BDT').toUpperCase();
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


