/**
 * Cookie Management & GDPR/ePrivacy Consent Service for Pure Herbex
 */

export interface CookieConsentPreferences {
  essential: boolean; // Always true (Cart, Session, Leopards Courier Tracking)
  analytics: boolean; // Performance & Pageview analytics
  marketing: boolean; // Promotions & Personalized recommendations
  timestamp: string;  // ISO timestamp of consent
  version: string;    // Consent policy version
}

const CONSENT_COOKIE_NAME = 'pureherbex_cookie_consent';
const CONSENT_STORAGE_KEY = 'pureherbex_cookie_consent_v1';
const CURRENT_POLICY_VERSION = '1.0';

/**
 * Retrieve a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = encodeURIComponent(name) + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}

/**
 * Set a cookie with standard security attributes (SameSite=Lax, Secure on HTTPS, Path=/)
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 365,
  options: { sameSite?: 'Lax' | 'Strict' | 'None'; secure?: boolean } = {}
): void {
  if (typeof document === 'undefined') return;

  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }

  const isSecure = options.secure ?? (typeof window !== 'undefined' && window.location.protocol === 'https:');
  const sameSite = options.sameSite || 'Lax';

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=/; SameSite=${sameSite}${isSecure ? '; Secure' : ''}`;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`;
}

/**
 * Retrieve current cookie consent preferences
 */
export function getCookieConsent(): CookieConsentPreferences | null {
  try {
    // 1. Try reading from cookie
    const cookieVal = getCookie(CONSENT_COOKIE_NAME);
    if (cookieVal) {
      return JSON.parse(cookieVal) as CookieConsentPreferences;
    }

    // 2. Fallback to localStorage
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as CookieConsentPreferences;
      }
    }
  } catch (e) {
    console.warn('Could not read cookie consent', e);
  }
  return null;
}

/**
 * Check if the user has already made a consent choice
 */
export function hasUserRespondedToConsent(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Save user cookie consent preferences
 */
export function saveCookieConsent(preferences: Partial<CookieConsentPreferences>): CookieConsentPreferences {
  const fullConsent: CookieConsentPreferences = {
    essential: true, // Always required for app operation
    analytics: preferences.analytics ?? true,
    marketing: preferences.marketing ?? true,
    timestamp: new Date().toISOString(),
    version: CURRENT_POLICY_VERSION
  };

  const serialized = JSON.stringify(fullConsent);

  // Save to 1-year persistent cookie
  setCookie(CONSENT_COOKIE_NAME, serialized, 365);

  // Also sync with localStorage for fast client lookup
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
    } catch (e) {}
  }

  // Dispatch event so app listeners can react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pureherbex_cookie_consent_updated', { detail: fullConsent }));
  }

  return fullConsent;
}

/**
 * Reset cookie consent (for testing or when user clicks 'Cookie Settings')
 */
export function resetCookieConsent(): void {
  deleteCookie(CONSENT_COOKIE_NAME);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pureherbex_cookie_consent_updated', { detail: null }));
  }
}
