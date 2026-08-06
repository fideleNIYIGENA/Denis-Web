import { useState } from 'react';

/** Image with lazy loading, a skeleton placeholder and a fade-in effect. */
export default function LazyImage({ src, alt = '', className = '', imgClassName = '', ...props }) {
  const [loaded, setLoaded] = useState(false);

  // An empty URL would otherwise keep the skeleton visible forever.
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-center text-sm text-slate-500 dark:bg-night-600 dark:text-slate-400 ${className}`}
        role="img"
        aria-label={alt || 'Image unavailable'}
      >
        <span className="px-6">Image coming soon</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="skeleton absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        {...props}
      />
    </div>
  );
}
