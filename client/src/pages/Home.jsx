import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaMusic, FaArrowRight, FaCalendarDays } from 'react-icons/fa6';
import { FiCalendar, FiImage, FiMail, FiRadio, FiRefreshCw, FiUser } from 'react-icons/fi';
import api from '../api/client.js';
import useSEO from '../hooks/useSEO.js';
import { useData } from '../contexts/DataContext.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import MusicCard from '../components/MusicCard.jsx';
import VideoCard from '../components/VideoCard.jsx';
import EventCard from '../components/EventCard.jsx';
import VideoModal from '../components/VideoModal.jsx';
import Newsletter from '../components/Newsletter.jsx';
import Loader from '../components/Loader.jsx';
import LazyImage from '../components/LazyImage.jsx';

const PLATFORM_STRIP = [
  { key: 'spotify', label: 'Spotify' },
  { key: 'apple_music', label: 'Apple Music' },
  { key: 'boomplay', label: 'Boomplay' },
  { key: 'audiomack', label: 'Audiomack' },
  { key: 'youtube', label: 'YouTube' },
];

const PUBLIC_LINKS = [
  { to: '/about', label: 'About Denis', description: 'Learn about the ministry and mission.', icon: FiUser },
  { to: '/music', label: 'Music', description: 'Listen to the latest worship songs.', icon: FaMusic },
  { to: '/gallery', label: 'Gallery', description: 'See worship and ministry moments.', icon: FiImage },
  { to: '/events', label: 'Events', description: 'Find upcoming worship gatherings.', icon: FiCalendar },
  { to: '/contact', label: 'Contact', description: 'Send a message or invitation.', icon: FiMail },
];

export default function Home() {
  useSEO({});
  const { settings, social, error: sharedDataError } = useData();
  const [songs, setSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [video, setVideo] = useState(null);
  const [events, setEvents] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [contentError, setContentError] = useState(false);

  useEffect(() => {
    const loadHomeContent = async () => {      setContentError(false);
      try {
        const [songRes, videoRes, eventRes, galleryRes] = await Promise.all([
          api.get('/songs', { params: { featured: 'true', limit: 4 } }),
          api.get('/videos/featured'),
          api.get('/events/upcoming'),
          api.get('/gallery', { params: { limit: 4 } }),
        ]);
        let list = songRes.data.data;
        if (list.length === 0) {
          const latest = await api.get('/songs', { params: { limit: 4 } });
          list = latest.data.data;
        }
        setSongs(list);
        setVideo(videoRes.data.data?.[0] || null);
        setEvents(eventRes.data.data || []);
        setGallery(galleryRes.data.data || []);
      } catch {
        // sections render as empty on failure
        setContentError(true);
      } finally {
        setSongsLoading(false);
      }
    };

    loadHomeContent();
  }, []);

  // Playback starts when the video opens: record the view and bump the counter.
  const openVideo = (video) => {
    setPlayingVideo(video);
    api.post(`/videos/${video.id}/view`).catch(() => {});
    setVideo((cur) => (cur?.id === video.id ? { ...cur, view_count: (cur.view_count || 0) + 1 } : cur));
  };

  const heroTitle = settings?.hero_title || 'Denis Ndayishimiye';
  const heroSubtitle = settings?.hero_subtitle || 'Gospel Artist • Guitarist • Singer-Songwriter • Worship Leader';
  const heroImage = settings?.hero_image_url || '';
  const platforms = PLATFORM_STRIP.map((p) => ({ ...p, url: social?.[p.key] })).filter((p) => p.url);
  const apiUnavailable = sharedDataError || contentError;

  return (
    <>
      {/* ------------------------------ HERO ------------------------------ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night text-white">
        {heroImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
            aria-hidden
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 15% 20%, rgba(255,162,1,0.18), transparent 45%), radial-gradient(circle at 85% 75%, rgba(163,230,53,0.12), transparent 50%), linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)',
            }}
            aria-hidden
          />
        )}
        <div className="hero-gradient absolute inset-0" aria-hidden />

        <div className="container-x relative flex flex-col items-center py-32 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 flex items-center gap-2 rounded-full border border-gold/50 bg-white/5 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-gold backdrop-blur"
          >
            <FiRadio className="h-4 w-4 text-gold" /> Rwandan Gospel Artist
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl"
          >
            {heroTitle.split(' ').map((word, i) =>
              word.toLowerCase() === 'denis' ? (
                <span key={i}>
                  <span className="text-gradient">{word}</span>{' '}
                </span>
              ) : (
                <span key={i}>{word}{' '}</span>
              )
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-5 max-w-2xl text-lg text-slate-300 sm:text-xl"
          >
            {heroSubtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400"
          >
            {settings?.site_description?.slice(0, 180) || 'Declaring the goodness of God through music, worship and ministry.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-9 flex flex-col gap-4 sm:flex-row"
          >
            <Link to="/music" className="btn-primary text-base">
              <FaPlay className="h-4 w-4" /> Listen Now
            </Link>
            <Link to="/videos" className="btn-royal text-base">
              <FaMusic className="h-4 w-4" /> Watch Videos
            </Link>
            <Link to="/events" className="btn-outline text-base">
              <FaCalendarDays className="h-4 w-4" /> Events
            </Link>
          </motion.div>

          {apiUnavailable && (
            <div className="mt-8 max-w-xl rounded-2xl border border-gold/30 bg-night/50 px-5 py-4 text-left text-sm text-slate-200 backdrop-blur">
              <p className="font-semibold text-gold">Content is temporarily unavailable</p>
              <p className="mt-1 text-slate-300">
                The website is ready, but its content service is not responding yet. Please try again shortly.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gold transition hover:text-gold-200"
              >
                <FiRefreshCw className="h-4 w-4" /> Retry content
              </button>
            </div>
          )}

          {platforms.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-3"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Stream on</span>
              {platforms.map((p) => (
                <a
                  key={p.key}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur transition hover:border-gold hover:text-gold"
                >
                  {p.label}
                </a>
              ))}
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="h-10 w-6 rounded-full border-2 border-white/25 p-1">
            <div className="mx-auto h-2 w-1 animate-bounce rounded-full bg-gold" />
          </div>
        </div>
      </section>

      {/* ---------------------------- PUBLIC LINKS --------------------------- */}
      <section className="border-y border-slate-200 bg-white py-10 dark:border-white/10 dark:bg-night-700">
        <div className="container-x">
          <div className="mb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Explore</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">Discover the Ministry</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PUBLIC_LINKS.map(({ to, label, description, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:border-gold hover:shadow-card dark:border-white/10 dark:hover:bg-white/5"
              >
                <Icon className="h-5 w-5 text-gold" />
                <h3 className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white">{label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- LATEST MUSIC --------------------------- */}
      <section className="bg-slate-50 py-20 dark:bg-night-800">
        <div className="container-x">
          <SectionHeading
            eyebrow="New Releases"
            title="Latest Music"
            subtitle="Fresh worship songs and studio recordings, ready to stream and download."
          />
          {songsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-96" />
              ))}
            </div>
          ) : songs.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {songs.map((song, i) => (
                <MusicCard key={song.id} song={song} index={i} />
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-slate-500">Music is coming soon. Stay tuned!</p>
          )}
          <div className="mt-10 text-center">
            <Link to="/music" className="btn-primary">
              Explore All Music <FaArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------- LATEST VIDEO ---------------------------- */}
      <section className="py-20">
        <div className="container-x">
          <SectionHeading eyebrow="Watch" title="Latest Video" subtitle="Worship sessions, live performances and ministry moments." />
          {video ? (
            <div className="mx-auto max-w-3xl">
              <VideoCard video={video} index={0} onPlay={openVideo} />
              <div className="mt-8 text-center">
                <Link to="/videos" className="btn-primary">
                  All Videos <FaArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-slate-500">Videos are coming soon.</p>
          )}
        </div>
      </section>

      {/* --------------------------- UPCOMING EVENTS --------------------------- */}
      <section className="bg-slate-50 py-20 dark:bg-night-800">
        <div className="container-x">
          <SectionHeading eyebrow="Don't Miss" title="Upcoming Events" subtitle="Join Denis in worship — live concerts, worship nights and conferences." />
          {events.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {events.map((ev, i) => (
                <EventCard key={ev.id} event={ev} index={i} />
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-slate-500 dark:text-slate-400">No events have been uploaded yet. Please check back soon.</p>
          )}
          <div className="mt-10 text-center">
            <Link to="/events" className="btn-primary">
              View All Events <FaArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------ GALLERY ----------------------------- */}
      <section className="py-20">
        <div className="container-x">
          <SectionHeading eyebrow="Moments" title="Photo Gallery" subtitle="A glimpse into worship nights, concerts and ministry moments." />
          {gallery.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {gallery.map((image) => (
                <LazyImage key={image.id} src={image.image_url} alt={image.caption || 'Gallery image'} className="aspect-[4/3] w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-slate-500 dark:text-slate-400">No gallery images have been uploaded yet. Please check back soon.</p>
          )}
          <div className="mt-10 text-center">
            <Link to="/gallery" className="btn-primary">
              View Gallery <FaArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------- BIOGRAPHY PREVIEW --------------------------- */}
      <section className="py-20">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-gold">The Story</p>
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              A Heart for Worship, A Voice for the Nations
            </h2>
            <p className="mt-5 leading-relaxed text-slate-500 dark:text-slate-400">
              {settings?.about_summary ||
                'Denis Ndayishimiye is a Rwandan gospel artist whose music carries the presence of God. As a guitarist, singer-songwriter, producer and worship leader, he creates worship that transcends language and culture.'}
            </p>
            <p className="mt-4 leading-relaxed text-slate-500 dark:text-slate-400">
              From intimate acoustic sessions to stadium worship nights, Denis is dedicated to lifting the name of Jesus in Rwanda and beyond.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/biography" className="btn-primary">
                Read Full Biography <FaArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/about" className="btn-outline border-gold/40 text-gold">
                About Denis
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gold-gradient opacity-20 blur-2xl" aria-hidden />
            <LazyImage
              src={settings?.profile_image_url || settings?.hero_image_url || ''}
              alt="Denis Ndayishimiye"
              className="aspect-[4/5] w-full rounded-3xl"
            />
            {!settings?.profile_image_url && !settings?.hero_image_url && (
              <div className="skeleton aspect-[4/5] w-full rounded-3xl" />
            )}
            <div className="absolute -bottom-5 left-6 rounded-2xl bg-gold-gradient px-6 py-3 text-night shadow-glow">
              <p className="font-display text-2xl font-bold">Worship</p>
              <p className="text-xs font-semibold">Ministry • Music • Guitar</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------ NEWSLETTER ------------------------------ */}
      <Newsletter />
    </>
  );
}
