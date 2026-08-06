import { FiMail, FiPhone, FiGlobe, FiMusic } from 'react-icons/fi';
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaSpotify,
  FaApple,
  FaXTwitter,
  FaWhatsapp,
  FaThreads,
  FaHeadphones,
} from 'react-icons/fa6';

/** Build a clickable URL from a platform + stored value. */
export function buildSocialUrl(key, value) {
  if (!value) return null;
  switch (key) {
    case 'email':
      return `mailto:${value}`;
    case 'phone':
      return `tel:${value.replace(/[^+\d]/g, '')}`;
    case 'whatsapp':
      return `https://wa.me/${value.replace(/[^+\d]/g, '').replace(/^\+/, '')}`;
    case 'website':
      return value.startsWith('http') ? value : `https://${value}`;
    default:
      return value.startsWith('http') ? value : `https://${value}`;
  }
}

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: FaFacebookF },
  { key: 'instagram', label: 'Instagram', icon: FaInstagram },
  { key: 'tiktok', label: 'TikTok', icon: FaTiktok },
  { key: 'youtube', label: 'YouTube', icon: FaYoutube },
  { key: 'spotify', label: 'Spotify', icon: FaSpotify },
  { key: 'apple_music', label: 'Apple Music', icon: FaApple },
  { key: 'boomplay', label: 'Boomplay', icon: FiMusic },
  { key: 'audiomack', label: 'Audiomack', icon: FaHeadphones },
  { key: 'x_twitter', label: 'X (Twitter)', icon: FaXTwitter },
  { key: 'threads', label: 'Threads', icon: FaThreads },
  { key: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp },
  { key: 'email', label: 'Email', icon: FiMail },
  { key: 'phone', label: 'Phone', icon: FiPhone },
  { key: 'website', label: 'Website', icon: FiGlobe },
];

export default function SocialLinks({ social = {}, size = 'md', className = '' }) {
  const data = social ?? {};
  const available = PLATFORMS.filter((p) => buildSocialUrl(p.key, data[p.key]));
  if (available.length === 0) return null;

  const sizeClass =
    size === 'lg' ? 'h-11 w-11 text-lg' : size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {available.map((p) => {
        const Icon = p.icon;
        const href = buildSocialUrl(p.key, data[p.key]);
        return (
          <a
            key={p.key}
            href={href}
            target={p.key === 'email' || p.key === 'phone' ? undefined : '_blank'}
            rel="noreferrer noopener"
            aria-label={p.label}
            title={p.label}
            className={`flex ${sizeClass} items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-gold hover:text-night focus:outline-none focus:ring-2 focus:ring-gold/60`}
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}
