import React, { ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../Header';
import Footer from '../Footer';
import AdminSidebar from '../AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export default function AdminLayout({ 
  children, 
  title = 'Admin | contact-tables', 
  description, 
  className 
}: AdminLayoutProps) {
  const router = useRouter();
  
  // Bestimme das aktive Menüelement basierend auf dem Pfad
  const getActiveItem = () => {
    const path = router.pathname;
    
    if (path.includes('/admin/dashboard')) return 'dashboard';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/restaurants')) return 'restaurants';
    if (path.includes('/admin/partner-requests')) return 'partner-requests';
    if (path.includes('/admin/categories')) return 'categories';
    if (path.includes('/admin/amenities')) return 'amenities';
    if (path.includes('/admin/cities')) return 'cities';
    if (path.includes('/admin/blogs')) return 'blogs';
    if (path.includes('/admin/newsletters')) return 'newsletter';
    if (path.includes('/admin/campaigns/analytics')) return 'analytics';
    if (path.includes('/admin/campaigns')) return 'campaigns';
    if (path.includes('/admin/email-builder')) return 'email-builder';
    if (path.includes('/admin/email-templates')) return 'email-templates';
    if (path.includes('/admin/settings')) return 'settings';
    if (path.includes('/admin/subscriptions')) return 'subscriptions';
    if (path.includes('/admin/moderation')) return 'moderation';
    if (path.includes('/admin/contact-tables/analytics')) return 'contact-tables-analytics';
    
    return 'dashboard'; // Standardwert
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
      </Head>
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem={getActiveItem()} />
        <main className={`flex-1 p-6 pt-24 md:ml-64 ${className || ''}`}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
