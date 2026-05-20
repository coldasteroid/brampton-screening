import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { headers } from 'next/headers';
import Nav from '~/components/Nav';
import { LANGUAGES, t } from '~/lib/i18n';
import { getCurrentUser } from '~/lib/auth-server';
import { getLang } from '~/lib/i18n-server';
import '~/styles/global.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-fraunces',
});

export const metadata: Metadata = {
  title: 'FairPlan — Brampton APS Modernization',
  description:
    'AI-native administrative penalty modernization and personalized payment experience for the City of Brampton.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'FairPlan — Brampton APS Modernization',
    description:
      'AI-native administrative penalty modernization and personalized payment experience for the City of Brampton.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, lang, hdrs] = await Promise.all([getCurrentUser(), getLang(), headers()]);
  const pathname = hdrs.get('x-pathname') ?? '/';
  const dir = LANGUAGES[lang].dir;

  return (
    <html lang={lang} dir={dir} className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen gradient-trust">
        <a href="#main" className="skip-link">
          {t(lang, 'a11y.skip_to_content')}
        </a>
        <Nav user={user} lang={lang} pathname={pathname} />
        <main id="main">{children}</main>
        <footer className="mt-24 border-t border-line/60 bg-ink text-white/85">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-14 md:grid-cols-4 lg:px-10">
            <div className="md:col-span-2">
              <p className="font-display text-2xl font-semibold tracking-tight text-white">FairPlan</p>
              <p className="mt-3 max-w-prose text-sm text-white/70">
                A proof of concept for the City of Brampton&apos;s Administrative Penalty System
                Modernization &amp; Personalized Payment Experience program. Not affiliated with the City.
                Built on Cloudflare.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Built with</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li>Cloudflare Workers</li>
                <li>Workers AI · AI Gateway</li>
                <li>D1 · R2 · KV</li>
                <li>Browser Rendering</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Public data</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li>Brampton GeoHub</li>
                <li>Statistics Canada 2021</li>
                <li>Bank of Canada Valet</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10">
            <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-2 px-6 py-5 text-xs text-white/60 md:flex-row md:items-center md:justify-between lg:px-10">
              <span>© 2026 FairPlan POC. Brampton, Ontario.</span>
              <span>v0.1 · 1-day sprint build</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
