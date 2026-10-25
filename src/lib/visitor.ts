const VISITOR_ID_KEY = 'blog_visitor_id';

/**
 * Returns a persistent anonymous visitor ID stored in localStorage.
 * Generated once as a random UUID and contains zero personally identifiable data.
 * Used solely for deduplicating blog likes per visitor.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);

      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch (err) {
    console.warn('LocalStorage is not accessible for visitorId:', err);
    return 'v-anonymous-session';
  }
}
