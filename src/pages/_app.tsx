import { useState } from 'react';
import type { AppProps } from 'next/app';


import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Toaster position="bottom-center" />
      <Component {...pageProps} />
    </AuthProvider>
  );
}