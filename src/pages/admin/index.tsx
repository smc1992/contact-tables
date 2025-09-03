import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { withAuth } from '../../utils/withAuth';

export default function AdminIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Umleitung zu /admin/dashboard
    router.replace('/admin/dashboard');
  }, [router]);
  
  // Zeige eine leere Seite während der Umleitung
  return null;
}

export const getServerSideProps = withAuth(['ADMIN', 'admin'], async (context, user) => {
  return {
    props: {}
  };
});