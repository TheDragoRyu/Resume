import type { Metadata } from 'next';
import { Silkscreen } from 'next/font/google';
import '@/styles/globals.css';
import SkipLink from '@/components/layout/SkipLink';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getNavData } from '@/content/content-loader';

const silkscreen = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-silkscreen',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Portfolio — Software Engineer',
    template: '%s — Portfolio',
  },
  description:
    'Software engineer portfolio showcasing experience, skills, and projects.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getNavData();

  return (
    <html lang="en" className={silkscreen.variable}>
      <body className="scanlines crt-vignette flex min-h-screen flex-col">
        <SkipLink />
        <Header navData={navData} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
