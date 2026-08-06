import useSEO from '../hooks/useSEO.js';
import PageHeader from '../components/PageHeader.jsx';

export default function PrivacyPage() {
  useSEO({
    title: 'Privacy Policy',
    description: 'Privacy policy for the Denis Ndayishimiye website.',
    url: window.location.href,
  });

  const sections = [
    {
      title: '1. Information We Collect',
      text: 'When you use the contact form or newsletter signup, we collect the information you voluntarily provide — such as your name, email address, phone number and the content of your message. We also collect basic, non-identifying analytics data (pages visited, device type) to understand how the site is used.',
    },
    {
      title: '2. How We Use Your Information',
      text: 'Your information is used to respond to your enquiries, send the newsletter you subscribed to, and improve the website experience. We never sell, rent or trade your personal information to third parties.',
    },
    {
      title: '3. Data Storage & Security',
      text: 'Information is stored securely in a managed PostgreSQL database (Supabase) with restricted access. Contact messages are only visible to the site administrator. Audio, image and video files are served from secure cloud storage.',
    },
    {
      title: '4. Cookies & Local Storage',
      text: 'This website uses browser local storage to remember your theme preference (dark/light mode) and, for administrators, a login session token. These are stored on your own device and are not used for cross-site tracking.',
    },
    {
      title: '5. Third-Party Services',
      text: 'The website embeds media from third-party services (e.g., YouTube for videos). Those services have their own privacy policies and may set their own cookies. External links to streaming platforms (Spotify, Apple Music, etc.) are governed by those platforms’ policies.',
    },
    {
      title: '6. Your Rights',
      text: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us. You can unsubscribe from the newsletter at any time by requesting removal.',
    },
    {
      title: '7. Children’s Privacy',
      text: 'This website is not directed at children under 13, and we do not knowingly collect personal information from children.',
    },
    {
      title: '8. Changes to This Policy',
      text: 'We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.',
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="How we collect, use and protect your information."
        breadcrumb={[{ label: 'Privacy', to: '/privacy' }]}
      />

      <section className="py-16">
        <div className="container-x max-w-3xl">
          <p className="leading-relaxed text-slate-500 dark:text-slate-400">
            This Privacy Policy explains what information we collect on the official website of Denis Ndayishimiye and how it is used. By using this website, you agree to the practices described below.
          </p>

          <div className="mt-10 space-y-8">
            {sections.map((s) => (
              <article key={s.title}>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">{s.title}</h2>
                <p className="mt-3 leading-relaxed text-slate-500 dark:text-slate-400">{s.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-gold/30 bg-gold/5 p-6 text-sm text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-gold">Contact</p>
            <p className="mt-2">
              For any privacy questions or requests, please use the <a href="/contact" className="font-semibold text-gold underline">contact page</a>.
            </p>
            <p className="mt-2 text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </section>
    </>
  );
}
