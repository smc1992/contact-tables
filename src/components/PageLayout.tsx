import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export default function PageLayout({
  children,
  title,
  showHeader = true,
  showFooter = true,
  className = '',
}: PageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {showHeader && <Header />}
      
      <main className="flex-grow pt-24">
        {/* Container mit ausreichendem Abstand zum Header */}
        <div className={`container mx-auto px-4 py-8 ${className}`}>
          {title && (
            <h1 className="text-2xl font-bold mb-6 text-gray-800">{title}</h1>
          )}
          {children}
        </div>
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}
