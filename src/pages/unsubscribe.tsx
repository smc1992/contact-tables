import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Unsubscribe() {
  const router = useRouter();
  const { token } = router.query;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) return;

    const unsubscribe = async () => {
      try {
        const response = await fetch(`/api/unsubscribe?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          if (data.email) setEmail(data.email);
        } else {
          setStatus('error');
          setMessage(data.message || 'Ein Fehler ist aufgetreten');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Ein unerwarteter Fehler ist aufgetreten');
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <>
      <Head>
        <title>Newsletter abbestellen | Contact Tables</title>
        <meta name="description" content="Abmeldung vom Newsletter" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Newsletter abbestellen
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {status === 'loading' && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Abmeldung erfolgreich</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                  {email && (
                    <p className="mt-1 text-sm text-gray-500">
                      Die E-Mail-Adresse <strong>{email}</strong> wurde aus unserem Verteiler entfernt.
                    </p>
                  )}
                </div>
                <div className="mt-6">
                  <Link href="/" className="text-indigo-600 hover:text-indigo-500">
                    Zurück zur Startseite
                  </Link>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Fehler bei der Abmeldung</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
                <div className="mt-6">
                  <Link href="/" className="text-indigo-600 hover:text-indigo-500">
                    Zurück zur Startseite
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
