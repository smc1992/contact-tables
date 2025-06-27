import type { AppProps } from 'next/app';
import { useEffect } from 'react'; // useState wird hier nicht mehr direkt benötigt
import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';

export default function App({ Component, pageProps }: AppProps) { // initialSession Prop entfernt
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
} 