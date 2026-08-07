/**
 * Guest access credentials shared across the public site.
 *
 * After a successful checkout we store the buyer's email + access token in
 * localStorage so paid content unlocks instantly on this device across
 * browser sessions — no login or account needed.
 */
const TOKEN_KEY = 'dn_access_token';
const EMAIL_KEY = 'dn_payer_email';

const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // listener errors must never break credential updates
    }
  });
}

export function getCredentials() {
  return {
    token: localStorage.getItem(TOKEN_KEY),
    email: localStorage.getItem(EMAIL_KEY),
  };
}

export function setCredentials(email, token) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
  emit();
}

export function clearCredentials() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  emit();
}

/** Subscribe to credential changes. Returns an unsubscribe function. */
export function subscribeCredentials(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
