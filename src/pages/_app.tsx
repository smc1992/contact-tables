import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';

// Dynamisches Laden der Komponenten ohne SSR
const Toaster = dynamic(() => import('react-hot-toast').then(mod => mod.Toaster), {
  ssr: false
});
const AuthProvider = dynamic(() => import('@/contexts/AuthContext').then(mod => mod.AuthProvider), {
  ssr: false
});
const NotificationProvider = dynamic(() => import('@/contexts/NotificationContext').then(mod => mod.NotificationProvider), {
  ssr: false
});
import '@/styles/globals.css';
import 'highlight.js/styles/github.css';
import 'tippy.js/dist/tippy.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Toaster position="bottom-center" />
        <Component {...pageProps} />
      </NotificationProvider>
    </AuthProvider>
  );
}