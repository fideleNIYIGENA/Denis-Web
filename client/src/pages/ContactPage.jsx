import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPaperPlane, FaMapLocationDot, FaEnvelope, FaPhone } from 'react-icons/fa6';
import api from '../api/client.js';
import useSEO from '../hooks/useSEO.js';
import PageHeader from '../components/PageHeader.jsx';
import SocialLinks from '../components/SocialLinks.jsx';
import { useData } from '../contexts/DataContext.jsx';

const INITIAL = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactPage() {
  useSEO({
    title: 'Contact',
    description: 'Get in touch with Denis Ndayishimiye — bookings, collaborations, ministry opportunities and general enquiries.',
    url: window.location.href,
  });

  const { settings, social } = useData();
  const [form, setForm] = useState(INITIAL);
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [message, setMessage] = useState('');

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await api.post('/messages', form);
      setStatus('success');
      setMessage(res.data.message);
      setForm(INITIAL);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Get in Touch"
        title="Contact"
        subtitle="Bookings, collaborations, ministry invites and enquiries — we would love to hear from you."
        breadcrumb={[{ label: 'Contact', to: '/contact' }]}
      />

      <section className="py-16">
        <div className="container-x grid gap-10 lg:grid-cols-5">
          {/* Info column */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 lg:col-span-2"
          >
            <div className="card p-7">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Contact Information</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Reach out directly or connect on social media. Messages sent through the form arrive straight to the admin inbox.
              </p>

              <ul className="mt-6 space-y-4 text-sm">
                {social?.email && (
                  <li className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                      <FaEnvelope className="h-5 w-5" />
                    </span>
                    <a href={`mailto:${social.email}`} className="break-all text-slate-600 transition hover:text-gold dark:text-slate-300">
                      {social.email}
                    </a>
                  </li>
                )}
                {social?.phone && (
                  <li className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                      <FaPhone className="h-5 w-5" />
                    </span>
                    <a href={`tel:${social.phone.replace(/[^+\d]/g, '')}`} className="text-slate-600 transition hover:text-gold dark:text-slate-300">
                      {social.phone}
                    </a>
                  </li>
                )}
                {(settings?.contact_address || social?.website) && (
                  <li className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                      <FaMapLocationDot className="h-5 w-5" />
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {settings?.contact_address || social?.website?.replace(/^https?:\/\//, '')}
                    </span>
                  </li>
                )}
              </ul>

              <div className="mt-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">Follow Denis</p>
                <SocialLinks social={social} size="lg" />
              </div>
            </div>
          </motion.div>

          {/* Form column */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <form onSubmit={submit} className="card p-7 sm:p-9">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Send a Message</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">We typically reply within 1–3 days.</p>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="label">Full Name *</label>
                  <input id="name" name="name" type="text" required value={form.name} onChange={setField} placeholder="Your name" className="input" />
                </div>
                <div>
                  <label htmlFor="email" className="label">Email *</label>
                  <input id="email" name="email" type="email" required value={form.email} onChange={setField} placeholder="you@example.com" className="input" />
                </div>
                <div>
                  <label htmlFor="phone" className="label">Phone</label>
                  <input id="phone" name="phone" type="tel" value={form.phone} onChange={setField} placeholder="+250 7xx xxx xxx" className="input" />
                </div>
                <div>
                  <label htmlFor="subject" className="label">Subject *</label>
                  <input id="subject" name="subject" type="text" required value={form.subject} onChange={setField} placeholder="Booking / Collaboration / Enquiry" className="input" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="label">Message *</label>
                  <textarea id="message" name="message" required rows={6} value={form.message} onChange={setField} placeholder="Write your message…" className="input resize-y" />
                </div>
              </div>

              <button type="submit" disabled={status === 'sending'} className="btn-primary mt-7">
                <FaPaperPlane className="h-4 w-4" />
                {status === 'sending' ? 'Sending…' : 'Send Message'}
              </button>

              {status === 'success' && <p className="mt-4 rounded-xl bg-green-500/10 p-4 text-sm font-medium text-green-600 dark:text-green-400">{message}</p>}
              {status === 'error' && <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-600 dark:text-red-400">{message}</p>}
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}
