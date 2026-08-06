import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaGuitar, FaMusic, FaHeadphones, FaStar } from 'react-icons/fa6';
import useSEO from '../hooks/useSEO.js';
import useBiography from '../hooks/useBiography.js';
import { useData } from '../contexts/DataContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import LazyImage from '../components/LazyImage.jsx';

const CHAPTERS = [
  {
    period: 'The Beginning',
    title: 'A Musical Heart',
    text: 'From a young age, Denis was drawn to melody. While many found joy in song, Denis found himself captivated by the guitar — the instrument that would become an extension of his worship. What began as curiosity quickly became a divine assignment as he discovered that music was his language of prayer.',
  },
  {
    period: 'The Calling',
    title: 'Gifted to Serve',
    text: 'Serving in his local church, Denis experienced the power of corporate worship. It was there that his identity as a worship leader was forged. He learned that worship was never about performance but about presence — leading hearts, not just songs, into the presence of God.',
  },
  {
    period: 'The Craft',
    title: 'Singer, Songwriter & Producer',
    text: 'Denis grew beyond the stage, stepping into the studio as a songwriter and music producer. He began crafting original worship songs that carried the heart of Rwanda while speaking to a global audience. Every chord, every lyric and every production choice is an offering.',
  },
  {
    period: 'The Mission',
    title: 'Worship to the Nations',
    text: 'Today, Denis Ndayishimiye ministers through concerts, worship nights, recordings and collaborations. His passion remains unchanged: to see a generation transformed by the presence of God and to declare, through music, that Jesus is worthy.',
  },
];

const HIGHLIGHTS = [
  { icon: FaGuitar, label: 'Guitarist', text: 'Worship guitar with soulful, expressive play' },
  { icon: FaMusic, label: 'Songwriter', text: 'Original gospel songs in Kinyarwanda & English' },
  { icon: FaHeadphones, label: 'Producer', text: 'Studio production for worship records' },
  { icon: FaStar, label: 'Worship Leader', text: 'Leading congregations into God\'s presence' },
];

export default function Biography() {
  useSEO({
    title: 'Biography',
    description: 'The full biography of Denis Ndayishimiye — guitarist, singer-songwriter, producer and worship leader from Rwanda.',
    url: window.location.href,
  });

  const { settings } = useData();
  const biography = useBiography();

  return (
    <>
      <PageHeader
        eyebrow="The Story"
        title="Biography"
        subtitle="The life and ministry journey of Denis Ndayishimiye"
        breadcrumb={[{ label: 'Biography', to: '/biography' }]}
      />

      <section className="py-20">
        <div className="container-x">
          <div className="grid items-start gap-12 lg:grid-cols-5">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 lg:sticky lg:top-24"
            >
              <LazyImage src={settings?.profile_image_url || ''} alt="Denis Ndayishimiye" className="aspect-[4/5] w-full rounded-3xl" />
              <div className="card mt-6 p-6">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">At a Glance</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  {[
                    ['Role', 'Gospel Artist, Worship Leader'],
                    ['Instrument', 'Guitar'],
                    ['Style', 'Worship • Contemporary Gospel'],
                    ['Based in', 'Rwanda'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="font-semibold text-slate-500 dark:text-slate-400">{k}</dt>
                      <dd className="text-right text-slate-700 dark:text-slate-200">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </motion.div>

            <div className="space-y-10 lg:col-span-3">
              {biography ? (
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-gold">Biography</p>
                  <div className="whitespace-pre-line leading-relaxed text-slate-500 dark:text-slate-400">{biography}</div>
                </motion.div>
              ) : (
                <>
                  <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-gold">Introduction</p>
                    <p className="font-display text-2xl font-bold leading-snug text-slate-900 dark:text-white sm:text-3xl">
                      "My worship is my life, and my guitar is my voice."
                    </p>
                    <p className="mt-5 leading-relaxed text-slate-500 dark:text-slate-400">
                      Denis Ndayishimiye is a Rwandan gospel artist, guitarist, singer-songwriter, music producer and
                      worship leader. His ministry is built on a simple conviction — that music is a vehicle for the
                      presence of God. Whether leading a congregation of thousands or recording in the studio, Denis
                      carries a worship culture that is authentic, reverent and full of joy.
                    </p>
                  </motion.div>

                  {CHAPTERS.map((c, i) => (
                    <motion.article
                      key={c.title}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.05 * i }}
                      className="relative border-l-2 border-gold/40 pl-6"
                    >
                      <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-gold-gradient" aria-hidden />
                      <p className="text-xs font-bold uppercase tracking-widest text-gold">{c.period}</p>
                      <h2 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">{c.title}</h2>
                      <p className="mt-3 leading-relaxed text-slate-500 dark:text-slate-400">{c.text}</p>
                    </motion.article>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-slate-50 py-20 dark:bg-night-800">
        <div className="container-x">
          <SectionHeading eyebrow="Gifts & Callings" title="More Than a Musician" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((h, i) => (
              <motion.div
                key={h.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card p-6 text-center"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient text-night">
                  <h.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">{h.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{h.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/music" className="btn-primary">
              Listen to the Music <FaArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
