import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Kunden können keine Events erstellen - nur reservieren
// Diese Seite leitet zum Dashboard weiter
export default function CreateEventRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Weiterleitung...</h1>
        <p className="text-gray-600">
          Als Kunde kannst du Tische reservieren, aber keine Events erstellen.
        </p>
      </div>
    </div>
  );
}
