import { useState } from 'react';
import { FiMail, FiSend } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../api/client.js';

/** Newsletter signup form. */
export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('sending');
    try {
      const res = await api.post('/messages/subscribers', { email });
      setStatus('success');
      setMessage(res.data.message);
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-night">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 30%, rgba(255,162,1,0.3), transparent 50%), radial-gradient(circle at 85% 80%, rgba(163,230,53,0.15), transparent 50%)',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="container-x relative"
      >
        <div className="glass mx-auto max-w-3xl rounded-3xl p-8 text-center sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient text-night">
            <FiMail className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold text-white sm:text-3xl">Join the Worship Family</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-300">
            Subscribe for new music releases, upcoming events and ministry updates — straight to your inbox.
          </p>

          <form onSubmit={submit} className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="w-full rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white placeholder-slate-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
            <button type="submit" disabled={status === 'sending'} className="btn-primary shrink-0">
              <FiSend className="h-4 w-4" />
              {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>

          {status === 'success' && <p className="mt-4 text-sm font-medium text-green-400">{message}</p>}
          {status === 'error' && <p className="mt-4 text-sm font-medium text-red-400">{message}</p>}
        </div>
      </motion.div>
    </section>
  );
}
