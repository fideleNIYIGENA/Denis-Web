import { useEffect } from 'react';

const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'Denis Ndayishimiye';
const DEFAULT_TITLE = 'Denis Ndayishimiye | Rwandan Gospel Artist, Guitarist & Worship Leader';
const DEFAULT_DESCRIPTION =
  'Official website of Denis Ndayishimiye — Rwandan Gospel Artist, Guitarist, Singer-Songwriter, Music Producer and Worship Leader.';

function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Lightweight SEO helper — keeps title, description, Open Graph and
 * Twitter cards in sync for every page.
 */
export default function useSEO({ title, description, image, url } = {}) {
  useEffect(() => {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const pageDescription = description || DEFAULT_DESCRIPTION;
    const pageUrl = url || window.location.href;

    document.title = pageTitle;
    setMeta('name', 'description', pageDescription);
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', pageDescription);
    setMeta('property', 'og:url', pageUrl);
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', pageDescription);
    if (image) {
      setMeta('property', 'og:image', image);
      setMeta('name', 'twitter:image', image);
    }

    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', pageUrl);
  }, [title, description, image, url]);
}
