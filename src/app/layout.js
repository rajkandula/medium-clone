import './globals.css';
import Providers from './Providers';
import localFont from 'next/font/local';
import { SITE_URL } from '@/lib/siteUrl';

// Self-hosted from the open-source @fontsource package — the build machine and
// the browser never contact Google.
const inter = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'BlogWrite | Where Ideas Come to Life',
  description: 'A modern blogging platform powered by AI. Write, share, and discover stories that matter.',
  keywords: ['blog', 'writing', 'AI writing', 'content creation', 'blogging platform', 'medium alternative'],
  authors: [{ name: 'BlogWrite' }],
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
  openGraph: {
    title: 'BlogWrite | Where Ideas Come to Life',
    description: 'A modern blogging platform powered by AI. Write, share, and discover stories that matter.',
    type: 'website',
    siteName: 'BlogWrite',
    images: [{ url: '/favicon.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlogWrite | Where Ideas Come to Life',
    description: 'A modern blogging platform powered by AI.',
    images: ['/favicon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
