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
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, customData, { eventID: eventId });
  }

  api
    .post('/events', {
      eventName,
      eventId,
      eventSourceUrl,
      userData,
      customData,
      eventTime: Math.floor(Date.now() / 1000),
    })
    .catch(() => {});

  return eventId;
}


