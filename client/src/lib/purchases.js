/**
 * Guest payer email shared across the public site.
 *
 * Access is verified by email against approved payments in the database, so
 * the only thing we persist on the visitor's device is their email address —
 * no login or account needed.
 */
const EMAIL_KEY = 'dn_payer_email';

const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // listener errors must never break email updates
    }
  });
}

export function getPayerEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function setPayerEmail(email) {
  try {
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // storage unavailable — email still applies for the session
  }
  emit();
}

export function clearPayerEmail() {
  try {
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    // storage unavailable
  }
  emit();
}

/** Subscribe to email changes. Returns an unsubscribe function. */
export function subscribeEmail(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
