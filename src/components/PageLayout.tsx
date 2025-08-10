import React, { ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from './Header';
import Footer from './Footer';
import LaunchPopup from './LaunchPopup';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export default function PageLayout({ children, title = 'contact-tables', description, className }: PageLayoutProps) {
  const router = useRouter();
  const noFooterPaths = ['/auth/login', '/auth/register', '/auth/update-password'];
  const showFooter = !noFooterPaths.includes(router.pathname);

  return (
    <>
      <div className="flex flex-col min-h-screen bg-neutral-50 font-sans text-secondary-800">
        <Head>
          <title>{title}</title>
          {description && <meta name="description" content={description} />}
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Header />
        <main className={`flex-grow ${className || ''}`}>
          <div className="w-full">
            {children}
          </div>
        </main>
        {showFooter && <Footer />}
      </div>
      <LaunchPopup />
    </>
  );
}
