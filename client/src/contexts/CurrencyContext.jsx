import { createContext, useContext, useEffect, useState } from 'react';

const CURRENCY_KEY = 'dn_currency';

const CurrencyContext = createContext(null);

/**
 * Global RWF / USD currency preference, persisted to localStorage so the
 * selected currency survives page reloads across the whole site.
 */
export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    try {
      return localStorage.getItem(CURRENCY_KEY) === 'USD' ? 'USD' : 'RWF';
    } catch {
      return 'RWF';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_KEY, currency);
    } catch {
      // storage unavailable — the currency still applies for the session
    }
  }, [currency]);

  const setCurrency = (next) => setCurrencyState(next === 'USD' ? 'USD' : 'RWF');

  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
};
