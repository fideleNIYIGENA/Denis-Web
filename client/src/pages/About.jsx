import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCompass, FaBullseye, FaTrophy, FaStar, FaArrowRight } from 'react-icons/fa6';
import api from '../api/client.js';
import useSEO from '../hooks/useSEO.js';
import { useData } from '../contexts/DataContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import LazyImage from '../components/LazyImage.jsx';
import Loader from '../components/Loader.jsx';

const ACHIEVEMENTS = [
  'Led worship at national events and conferences across Rwanda',
  'Recorded and released original gospel worship songs',
  'Guitarist for church worship teams and live sessions',
  'Produced studio recordings blending Rwandan worship with contemporary gospel',
];

const TIMELINE = [
  { period: 'Early Years', title: 'Gifted Through Guitar', text: 'Discovered a deep love for music and picked up the guitar, finding worship as his calling.' },
  { period: 'Discipleship', title: 'Worship Leading', text: 'Served faithfully in local church worship teams, growing as a leader and musician.' },
  { period: 'Studio', title: 'Recording & Producing', text: 'Stepped into music production and songwriting, crafting original gospel songs.' },
  { period: 'Today', title: 'Ministry to the Nations', text: 'Uses his gift to share the Gospel in Rwanda and beyond through concerts and worship nights.' },
];

export default function About() {
  useSEO({
    title: 'About Denis',
    description: 'Learn about Denis Ndayishimiye — his mission, vision and journey as a Rwandan gospel artist and worship leader.',
    url: window.location.href,
  });

  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useData();

  useEffect(() => {
    api
      .get('/gallery', { params: { limit: 6 } })
      .then((res) => setGallery(res.data.data || []))
      .catch(() => setGallery([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Who I Am"
        title="About Denis Ndayishimiye"
        subtitle="Guitarist • Singer-Songwriter • Music Producer • Worship Leader"
        breadcrumb={[{ label: 'About', to: '/about' }]}
      />

      {/* Biography intro */}
      <section className="py-20">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-gold">Biography</p>
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Called to Lead Worship</h2>
            <p className="mt-5 leading-relaxed text-slate-500 dark:text-slate-400">
              Denis Ndayishimiye is a Rwandan gospel artist whose heart beats for worship. As a skilled guitarist,
              singer-songwriter, music producer and worship leader, he has spent his life cultivating a sound that
              carries the presence of God into every room.
            </p>
            <p className="mt-4 leading-relaxed text-slate-500 dark:text-slate-400">
              His music blends authentic Rwandan worship with contemporary gospel, creating songs that unite
              generations and cross borders. Through live concerts, worship nights and studio recordings, Denis
              continues to point hearts toward Jesus.
            </p>
            <Link to="/biography" className="btn-primary mt-8">
              Full Biography <FaArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <LazyImage src={settings?.profile_image_url || ''} alt="Denis Ndayishimiye" className="aspect-[4/5] w-full rounded-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-slate-50 py-20 dark:bg-night-800">
        <div className="container-x">
          <SectionHeading eyebrow="Purpose" title="Mission & Vision" />
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: FaBullseye,
                title: 'Our Mission',
                text: 'To lead people into the presence of God through heartfelt worship, original gospel music and a life devoted to serving the Kingdom of God.',
              },
              {
                icon: FaCompass,
                title: 'Our Vision',
                text: 'To see a generation in Rwanda and across the world transformed by worship — singing in unity, resting in God\'s presence and walking in their divine purpose.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card p-8"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient text-night">
                  <item.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-500 dark:text-slate-400">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="py-20">
        <div className="container-x">
          <SectionHeading eyebrow="The Journey" title="How It Began" />
          <div className="mx-auto max-w-3xl">
            {TIMELINE.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex gap-6 pb-10 last:pb-0"
              >
                <div className="flex flex-col items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-gradient font-display text-sm font-bold text-night">
                    {i + 1}
                  </span>
                  {i < TIMELINE.length - 1 && <span className="mt-2 w-px flex-1 bg-gold/30" />}
                </div>
                <div className="pt-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-gold">{step.period}</p>
                  <h3 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{step.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="bg-slate-50 py-20 dark:bg-night-800">
        <div className="container-x">
          <SectionHeading eyebrow="Milestones" title="Achievements" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ACHIEVEMENTS.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  {i % 2 === 0 ? <FaTrophy className="h-5 w-5" /> : <FaStar className="h-5 w-5" />}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo gallery preview */}
      {gallery.length > 0 && (
        <section className="py-20">
          <div className="container-x">
            <SectionHeading eyebrow="Moments" title="Photo Gallery" subtitle="A glimpse into worship nights, concerts and ministry moments." />
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton aspect-[4/3]" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((img) => (
                  <LazyImage key={img.id} src={img.image_url} alt={img.caption || 'Gallery image'} className="aspect-[4/3] w-full rounded-2xl" />
                ))}
              </div>
            )}
            <div className="mt-10 text-center">
              <Link to="/gallery" className="btn-primary">
                View Full Gallery <FaArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
